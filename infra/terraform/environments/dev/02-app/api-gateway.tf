# =============================================================================
# W5 MH4 — API Gateway HTTP API trước Lambda bedrock-chat
# Auth: Lambda Authorizer (JWT validation — reuses app's existing JWT logic)
# Throttling: 10 req/s rate, 20 burst
# =============================================================================

# -----------------------------------------------------------------------------
# Lambda JWT Authorizer
# Validates Bearer token from Authorization header
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "authorizer_logs" {
  name              = "/aws/lambda/${var.project_name}-jwt-authorizer"
  retention_in_days = 7
  tags              = local.common_tags
}

resource "aws_iam_role" "lambda_authorizer" {
  name = "${var.project_name}-jwt-authorizer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "authorizer_basic_exec" {
  role       = aws_iam_role.lambda_authorizer.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Allow authorizer to read JWT_SECRET from Secrets Manager
resource "aws_iam_role_policy" "authorizer_secrets" {
  name = "${var.project_name}-authorizer-secrets-policy"
  role = aws_iam_role.lambda_authorizer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "ReadJwtSecret"
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [data.aws_secretsmanager_secret.app_config.arn]
    }]
  })
}

resource "aws_lambda_function" "jwt_authorizer" {
  function_name = "${var.project_name}-jwt-authorizer"
  description   = "JWT authorizer for API Gateway — validates Bearer tokens"
  role          = aws_iam_role.lambda_authorizer.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 10
  memory_size   = 128

  # Build: cd backend/lambda/jwt-authorizer && npm install && zip -r authorizer.zip .
  filename         = fileexists("${path.module}/../../../../backend/lambda/jwt-authorizer/authorizer.zip") ? "${path.module}/../../../../backend/lambda/jwt-authorizer/authorizer.zip" : "${path.module}/../../../lambda-placeholder.zip"
  source_code_hash = fileexists("${path.module}/../../../../backend/lambda/jwt-authorizer/authorizer.zip") ? filebase64sha256("${path.module}/../../../../backend/lambda/jwt-authorizer/authorizer.zip") : null

  environment {
    variables = {
      SECRET_NAME = var.app_config_secret_name
    }
  }

  depends_on = [aws_cloudwatch_log_group.authorizer_logs]

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# HTTP API
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-bedrock-api"
  retention_in_days = 7
  tags              = local.common_tags
}

resource "aws_apigatewayv2_api" "bedrock" {
  name          = "${var.project_name}-bedrock-api"
  protocol_type = "HTTP"
  description   = "HTTP API Gateway in front of bedrock-chat Lambda"

  cors_configuration {
    allow_origins = ["*"] # tighten in production
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

# Lambda Integration — bedrock-chat
resource "aws_apigatewayv2_integration" "bedrock_chat" {
  api_id                 = aws_apigatewayv2_api.bedrock.id
  integration_type       = "AWS_PROXY"
  integration_uri        = module.lambda_bedrock_chat.lambda_function_arn
  payload_format_version = "2.0"
}

# Route: POST /chat
resource "aws_apigatewayv2_route" "chat" {
  api_id             = aws_apigatewayv2_api.bedrock.id
  route_key          = "POST /chat"
  target             = "integrations/${aws_apigatewayv2_integration.bedrock_chat.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}

# Stage with throttling + access logging
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.bedrock.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_rate_limit  = 10 # 10 req/s
    throttling_burst_limit = 20 # burst 20
    logging_level          = "INFO"
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format         = "$context.requestId"
  }

  tags = local.common_tags
}

# Permissions — API GW invoke Lambda
resource "aws_lambda_permission" "api_gateway_bedrock_chat" {
  statement_id  = "AllowAPIGatewayInvokeBedrock"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_bedrock_chat.lambda_function_name
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

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------
output "api_gateway_url" {
  description = "API Gateway invoke URL — set as VITE_BEDROCK_API_URL in frontend"
  value       = aws_apigatewayv2_api.bedrock.api_endpoint
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.bedrock.id
}

output "jwt_authorizer_function_name" {
  description = "JWT Authorizer Lambda function name"
  value       = aws_lambda_function.jwt_authorizer.function_name
}
