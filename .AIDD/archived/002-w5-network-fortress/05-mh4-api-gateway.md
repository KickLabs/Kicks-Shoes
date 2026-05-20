# 05 — MH4: API Gateway trước Lambda Bedrock

## Target Lambda

**`bedrock-chat`** — xử lý AI chat query qua Bedrock Knowledge Base. Hiện tại được trigger bởi DynamoDB Streams. W5 thêm API Gateway HTTP API để frontend/client có thể gọi trực tiếp với auth.

---

## Architecture

```
Client
  │ POST /chat  +  Authorization: Bearer <jwt>
  ▼
API Gateway HTTP API
  │ Lambda Authorizer (validate JWT)
  │ Throttling: 10 req/s, burst 20
  ▼
Lambda bedrock-chat
  │
  ▼
Bedrock Knowledge Base → DynamoDB (save response)
```

---

## Terraform — API Gateway

Tạo `infra/terraform/environments/dev/02-app/api-gateway.tf`:

```hcl
# Lambda Authorizer function
resource "aws_lambda_function" "jwt_authorizer" {
  function_name = "${var.project_name}-jwt-authorizer"
  role          = aws_iam_role.lambda_authorizer.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  filename      = "${path.module}/authorizer.zip"

  environment {
    variables = {
      JWT_SECRET = data.aws_secretsmanager_secret_version.app_config.secret_string
    }
  }

  tags = local.common_tags
}

# IAM Role cho Authorizer Lambda
resource "aws_iam_role" "lambda_authorizer" {
  name = "${var.project_name}-authorizer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "authorizer_basic" {
  role       = aws_iam_role.lambda_authorizer.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# HTTP API
resource "aws_apigatewayv2_api" "bedrock" {
  name          = "${var.project_name}-bedrock-api"
  protocol_type = "HTTP"
  description   = "API Gateway trước Lambda bedrock-chat"

  cors_configuration {
    allow_origins = ["https://dev.${var.domain_name}"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["Authorization", "Content-Type"]
    max_age       = 300
  }

  tags = local.common_tags
}

# Lambda Authorizer
resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.bedrock.id
  authorizer_type  = "REQUEST"
  authorizer_uri   = aws_lambda_function.jwt_authorizer.invoke_arn
  identity_sources = ["$request.header.Authorization"]
  name             = "jwt-authorizer"

  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
  authorizer_result_ttl_in_seconds  = 300
}

# Lambda Integration
resource "aws_apigatewayv2_integration" "bedrock_chat" {
  api_id             = aws_apigatewayv2_api.bedrock.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.bedrock_chat.invoke_arn
  payload_format_version = "2.0"
}

# Route
resource "aws_apigatewayv2_route" "chat" {
  api_id             = aws_apigatewayv2_api.bedrock.id
  route_key          = "POST /chat"
  target             = "integrations/${aws_apigatewayv2_integration.bedrock_chat.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

# Stage với throttling
resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.bedrock.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_rate_limit  = 10   # 10 req/s
    throttling_burst_limit = 20   # burst 20
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
  }

  tags = local.common_tags
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-bedrock-api"
  retention_in_days = 7
  tags              = local.common_tags
}

# Permission cho API GW invoke Lambda
resource "aws_lambda_permission" "api_gateway_bedrock" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.bedrock_chat.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.bedrock.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_authorizer" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.jwt_authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.bedrock.execution_arn}/authorizers/${aws_apigatewayv2_authorizer.jwt.id}"
}

output "api_gateway_url" {
  value = aws_apigatewayv2_api.bedrock.api_endpoint
}
```

---

## Lambda Authorizer Code

Tạo `backend/lambda/jwt-authorizer/index.js`:

```javascript
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  try {
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAuthorized: false };
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    // Verify JWT
    const decoded = jwt.verify(token, secret);
    
    return {
      isAuthorized: true,
      context: {
        userId: decoded.id || decoded.sub,
        email: decoded.email
      }
    };
  } catch (error) {
    console.error('Auth error:', error.message);
    return { isAuthorized: false };
  }
};
```

Build và zip:

```bash
cd backend/lambda/jwt-authorizer
npm init -y
npm install jsonwebtoken
zip -r authorizer.zip index.js node_modules/
```

---

## App Code Update

Cập nhật `frontend/src/services/aiChatService.js`:

```javascript
// Trước: gọi backend API (backend invoke Lambda trực tiếp)
// Sau: gọi API Gateway URL trực tiếp

const API_GATEWAY_URL = import.meta.env.VITE_BEDROCK_API_URL;

export const sendBedrockMessage = async (message, token) => {
  const response = await fetch(`${API_GATEWAY_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message })
  });

  if (!response.ok) {
    throw new Error(`API Gateway error: ${response.status}`);
  }

  return response.json();
};
```

Thêm vào `frontend/.env`:
```
VITE_BEDROCK_API_URL=https://<api-id>.execute-api.ap-southeast-1.amazonaws.com
```

---

## Test Commands

```bash
# Lấy JWT token từ app login
TOKEN=$(curl -s -X POST https://api.dev.<domain>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}' \
  | jq -r '.token')

API_URL="https://<api-id>.execute-api.ap-southeast-1.amazonaws.com"

# Test 1: Authenticated → 200
curl -X POST "$API_URL/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"What shoes do you recommend?"}' \
  -w "\nHTTP Status: %{http_code}\n"
# Expected: HTTP Status: 200

# Test 2: No auth → 403
curl -X POST "$API_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' \
  -w "\nHTTP Status: %{http_code}\n"
# Expected: HTTP Status: 403
```

---

## Evidence Pack — MH4 Section

```markdown
## MH4 — API Gateway trước Lambda

**API:** HTTP API kicks-shoes-bedrock-api
**Route:** POST /chat → Lambda bedrock-chat (Lambda Proxy Integration)
**Auth:** Lambda Authorizer (JWT validation)
**Throttling:** 10 req/s rate, 20 burst

[Screenshot: API Gateway console — routes]
[Screenshot: Lambda Authorizer config]
[Screenshot: Throttling settings]

**Test curl authenticated (200):**
```
curl -X POST https://<api-id>.execute-api.../chat \
  -H "Authorization: Bearer <token>" \
  -d '{"message":"test"}'
→ HTTP 200: {"response":"..."}
```

**Test curl no auth (403):**
```
curl -X POST https://<api-id>.execute-api.../chat \
  -d '{"message":"test"}'
→ HTTP 403: {"message":"Forbidden"}
```

[Screenshot: curl 200 response]
[Screenshot: curl 403 response]
```
