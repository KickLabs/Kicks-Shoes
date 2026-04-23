# Week 3: Infrastructure Verification Script (v6 - FULL DEPLOY TEST)
$API_BASE_URL = "http://kicks-shoes-dev-alb-1501513987.us-west-2.elb.amazonaws.com/api"
$REGION = "us-west-2"

Write-Host "`n🚀 Starting Week 3 Verification Test (DEPLOYED ENV: $REGION)..." -ForegroundColor Cyan
Write-Host "-------------------------------------------"

# 1. Kiểm tra kết nối API
Write-Host "1. Checking Deployed API Connection..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "$API_BASE_URL/health" -Method Get
    Write-Host " [ONLINE]" -ForegroundColor Green
} catch {
    Write-Host " [OFFLINE] - Không thể kết nối tới $API_BASE_URL" -ForegroundColor Red
    return
}

# 2. Tạo/Tìm Conversation ID trên môi trường Deploy
Write-Host "2. Creating/Finding Conversation on Cloud..." -NoNewline
try {
    # Mẫu User ID và Shop ID (Cần tồn tại trong MongoDB Deploy)
    $convData = @{ 
        userId = "684169e24fae5b169f74e53f"
        shopId = "6845be4f54a7582c1d2109b8" 
    } | ConvertTo-Json
    $conv = Invoke-RestMethod -Uri "$API_BASE_URL/chat/conversation" -Method Post -Body $convData -ContentType "application/json"
    $DEPLOY_CONV_ID = $conv._id
    $SENDER = "684169e24fae5b169f74e53f"
    $RECEIVER = "6845be4f54a7582c1d2109b8"
    Write-Host " [OK: $DEPLOY_CONV_ID]" -ForegroundColor Green
} catch {
    Write-Host " [FAILED] - Lỗi tạo conversation. Kiểm tra MongoDB Connection trên ECS." -ForegroundColor Red
    return
}

# 3. Gửi tin nhắn test luồng Bedrock
Write-Host "3. Triggering AI Chat Flow on Cloud..." -NoNewline
$postData = @{
    conversationId = $DEPLOY_CONV_ID
    sender = $SENDER
    receiver = $RECEIVER
    content = "Tell me about the design of Kicks Shoes based on the knowledge base."
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "$API_BASE_URL/chat/message" -Method Post -Body $postData -ContentType "application/json"
    Write-Host " [SENT]" -ForegroundColor Green
    
    Write-Host "4. Waiting for Cloud processing (15s)..." -NoNewline
    Start-Sleep -Seconds 15
    Write-Host " [DONE]" -ForegroundColor Cyan
    
    # 5. Kiểm tra kết quả trong DynamoDB qua API GSI Query
    Write-Host "5. Verifying AI Response in DynamoDB..." -NoNewline
    $history = Invoke-RestMethod -Uri "$API_BASE_URL/dynamodb/messages/$DEPLOY_CONV_ID" -Method Get
    $aiMsg = $history.messages | Where-Object { $_.messageType -eq "ai" } | Select-Object -Last 1
    
    if ($aiMsg) {
        Write-Host " [SUCCESS: AI RESPONSE RECEIVED]" -ForegroundColor Green
        $preview = if ($aiMsg.content.Length -gt 200) { $aiMsg.content.Substring(0, 200) + "..." } else { $aiMsg.content }
        Write-Host "`n✨ AI Content Preview: $preview" -ForegroundColor Gray
    } else {
        Write-Host " [NO AI RESPONSE] - Hãy kiểm tra CloudWatch Logs của Lambda." -ForegroundColor Red
    }
} catch {
    Write-Host " [ERROR: $($_.Exception.Message)]" -ForegroundColor Red
}

Write-Host "-------------------------------------------"
Write-Host "✅ Deployment Test Finished." -ForegroundColor Cyan
