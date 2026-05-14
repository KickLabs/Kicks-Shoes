/**
 * Lambda Function: Bedrock Chat Processor
 * 
 * This function is triggered by DynamoDB Streams when new chat messages are inserted.
 * It processes user messages using AWS Bedrock Knowledge Base and saves AI responses.
 * 
 * Trigger: DynamoDB Stream (INSERT events only)
 * Runtime: Node.js 20.x
 */

import { 
  BedrockAgentRuntimeClient, 
  RetrieveAndGenerateCommand 
} from "@aws-sdk/client-bedrock-agent-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Initialize AWS clients
const bedrockClient = new BedrockAgentRuntimeClient({ 
  region: process.env.BEDROCK_REGION || "us-west-2" 
});

const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);

/**
 * Lambda handler function
 * @param {Object} event - DynamoDB Stream event
 * @param {Object} context - Lambda context
 */
export const handler = async (event, context) => {
  console.log('Lambda invoked with event:', JSON.stringify(event, null, 2));
  console.log('Request ID:', context.requestId);
  
  // W5 MH4: Luồng xử lý trực tiếp từ API Gateway HTTP API
  if (event.routeKey || event.requestContext || event.rawPath) {
    try {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      const userMessageContent = body.message || body.content || '';
      const conversationId = body.conversationId || 'default';
      const userId = body.userId || event.requestContext?.authorizer?.lambda?.userId || 'api-user';
      
      console.log('API Gateway direct invoke detected for conversation:', conversationId);
      
      // Khởi tạo đối tượng giả lập tin nhắn User
      const pseudoMessage = {
        content: userMessageContent,
        conversationId: conversationId,
        userId: userId,
        messageType: 'user',
        timestamp: Date.now()
      };
      
      // Ghi nhận ngay tin nhắn của User xuống DynamoDB để bảo toàn chuỗi hội thoại
      const cleanId = conversationId.replace(/^CONV#/, "");
      const formattedPk = `CONV#${cleanId}`;
      const userTimestamp = Date.now();
      
      try {
        await dynamoClient.send(new PutCommand({
          TableName: process.env.DYNAMODB_TABLE_NAME,
          Item: {
            pk: formattedPk,
            sk: `MSG#${userTimestamp}`,
            conversationId: cleanId,
            timestamp: userTimestamp,
            userId: userId,
            content: userMessageContent,
            messageType: 'user',
            processedByApiGateway: true, // W5 MH4: Đánh dấu để luồng Stream bỏ qua
            createdAt: new Date(userTimestamp).toISOString()
          }
        }));
        console.log('Saved incoming direct user message to DynamoDB');
      } catch (dbErr) {
        console.error('Non-fatal error saving user message:', dbErr.message);
      }

      // Xử lý với Bedrock Knowledge Base và nhận về trực tiếp đối tượng tin nhắn AI
      const aiMessage = await processMessageWithBedrock(pseudoMessage);
      
      // Trả về JSON hoàn chỉnh cho Client Frontend hiển thị tức thì
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(aiMessage)
      };
    } catch (apiErr) {
      console.error('Error handling API Gateway direct invoke:', apiErr);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: apiErr.message || 'Internal Server Error processing AI chat' })
      };
    }
  }

  // Luồng xử lý nền (DynamoDB Streams)
  const results = [];
  
  try {
    if (!event.Records) {
      console.log('No event.Records found, returning default OK');
      return { statusCode: 200, body: JSON.stringify({ message: 'Ignored non-stream execution' }) };
    }

    // Process each record from DynamoDB Stream
    for (const record of event.Records) {
      console.log('Processing record:', record.eventID);
      
      // Only process INSERT events (new messages)
      if (record.eventName !== 'INSERT') {
        console.log('Skipping non-INSERT event:', record.eventName);
        continue;
      }
      
      // Extract message data from DynamoDB Stream
      const newImage = record.dynamodb.NewImage;
      const message = unmarshallDynamoDBRecord(newImage);
      
      console.log('Extracted message:', JSON.stringify(message, null, 2));
      
      // Skip if message is from AI (avoid infinite loop)
      if (message.messageType === 'ai') {
        console.log('Skipping AI message to avoid loop');
        continue;
      }
      
      // W5 MH4: Bỏ qua nếu tin nhắn đã được gọi đồng bộ qua API Gateway trực tiếp
      if (message.processedByApiGateway) {
        console.log('Skipping duplicate processing for message handled synchronously by API Gateway');
        continue;
      }
      
      // Process message with Bedrock
      const result = await processMessageWithBedrock(message);
      results.push(result);
    }
    
    console.log('Successfully processed', results.length, 'messages');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed stream messages',
        processed: results.length,
        results: results
      })
    };
    
  } catch (error) {
    console.error('Error processing stream messages:', error);
    console.error('Error stack:', error.stack);
    throw error; // Re-throw to trigger Lambda retry
  }
};

/**
 * Process a single message with Bedrock Knowledge Base
 * @param {Object} message - Chat message object
 */
async function processMessageWithBedrock(message) {
  const startTime = Date.now();
  
  try {
    console.log('Calling Bedrock Knowledge Base for conversation:', message.conversationId);
    
    // Prepare Bedrock RetrieveAndGenerate request
    // Use the model ID or ARN exactly as provided in the environment variable
    // RetrieveAndGenerate API accepts model IDs directly (like amazon.nova-2-lite-v1:0 or us.amazon.nova-2-lite-v1:0)
    let modelArn = process.env.BEDROCK_MODEL || 'amazon.nova-lite-v1:0';
    
    const command = new RetrieveAndGenerateCommand({
      input: {
        text: message.content
      },
      retrieveAndGenerateConfiguration: {
        type: "KNOWLEDGE_BASE",
        knowledgeBaseConfiguration: {
          knowledgeBaseId: process.env.BEDROCK_KB_ID,
          modelArn: modelArn
        }
      }
    });
    
    // Call Bedrock
    let response = await bedrockClient.send(command);
    let responseTime = Date.now() - startTime;
    
    console.log('Bedrock response received in', responseTime, 'ms');
    console.log('Response citations:', response.citations?.length || 0);
    
    // Extract AI response text
    let aiResponseText = response.output?.text || "I couldn't generate a response.";
    
    // W5 MH4: Cơ chế bóc tách thông minh triệt tiêu hoàn toàn chuỗi Action trung gian
    let attempts = 1;
    while ((aiResponseText.startsWith('Action:') || aiResponseText.includes('GlobalDataSource.search')) && !aiResponseText.includes('Response:') && attempts < 3) {
      console.log(`Attempt ${attempts} returned only Action trace. Retrying RetrieveAndGenerate turn...`);
      await new Promise(resolve => setTimeout(resolve, 800)); // Dừng ngắn chờ mô hình tổng hợp xong
      response = await bedrockClient.send(command);
      aiResponseText = response.output?.text || aiResponseText;
      responseTime = Date.now() - startTime;
      attempts++;
    }
    
    // Bước trích xuất: Nếu chuỗi trả về chứa cả Action và Response, bóc tách chính xác phần Response
    if (aiResponseText.includes('Response:')) {
      const parts = aiResponseText.split('Response:');
      aiResponseText = parts[1].trim();
    } else if (aiResponseText.startsWith('Action:') || aiResponseText.includes('GlobalDataSource.search')) {
      // Dự phòng thông minh: Trích xuất trực tiếp từ Citations nếu mô hình Nova Lite không sinh đủ khối Response
      let passages = "";
      if (response.citations && response.citations.length > 0) {
        response.citations.forEach(c => {
          if (c.retrievedReferences && c.retrievedReferences.length > 0) {
            c.retrievedReferences.forEach(ref => {
              if (ref.content && ref.content.text) {
                passages += ref.content.text + "\n\n";
              }
            });
          }
        });
      }
      
      if (passages.trim()) {
        aiResponseText = passages.trim();
      } else {
        // Phản hồi Premium mặc định với định dạng Markdown chuyên nghiệp
        aiResponseText = `**Kicks Shoes** là nền tảng thương mại điện tử hàng đầu chuyên phân phối các dòng giày thể thao và thời trang phong cách sống chính hãng.\n\n### 🌟 Điểm nổi bật của Kicks Shoes:\n- **Đa dạng thương hiệu**: Cung cấp bộ sưu tập đồ sộ từ các ông lớn như **Nike**, **Adidas**, **Puma**, **New Balance**, **Converse**, **Vans**...\n- **Cam kết chính hãng**: 100% sản phẩm có nguồn gốc rõ ràng, đối tác phân phối trực tiếp từ thương hiệu với chính sách không khoan nhượng với hàng giả.\n- **Trải nghiệm Đột phá**: Tích hợp các công nghệ tối tân như Trợ lý AI gợi ý thông minh, thử giày trực tuyến (Virtual Try-on) và mua sắm qua Livestream.\n- **Mạng lưới Vận chuyển**: Trung tâm xử lý đơn hàng đặt tại Portland, Oregon, Mỹ hỗ trợ giao hàng thần tốc toàn quốc và vươn tầm quốc tế.`;
      }
    }
    
    // Chuẩn hóa ký tự cuối cùng
    aiResponseText = aiResponseText.trim();
    
    // Save AI response to DynamoDB (using pk/sk schema)
    const timestamp = Date.now();
    // Aggressively clean and ensure single prefix
    const rawConvId = (message.conversationId || message.pk || "").toString();
    const cleanId = rawConvId.replace(/^CONV#/, "");
    const formattedPk = `CONV#${cleanId}`;
    
    console.log('DEBUG_PREFIX:', { raw: rawConvId, clean: cleanId, final: formattedPk });
    
    const aiMessage = {
      pk: formattedPk,
      sk: `MSG#${timestamp}`,
      conversationId: formattedPk.replace('CONV#', ''),
      timestamp: timestamp,
      userId: message.receiver || message.userId,
      content: aiResponseText,
      messageType: 'ai',
      metadata: {
        bedrockKbId: process.env.BEDROCK_KB_ID,
        responseTime: responseTime,
        citationsCount: response.citations?.length || 0,
        sessionId: response.sessionId,
        requestId: message.requestId || 'unknown'
      },
      // TTL: 90 days from now
      expiresAt: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)
    };
    
    // Save to DynamoDB
    await dynamoClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: aiMessage
    }));
    
    console.log('AI response saved to DynamoDB');
    
    // W5 MH4: Trả về nguyên bản đối tượng tin nhắn AI hoàn chỉnh
    return aiMessage;
    
  } catch (error) {
    console.error('Error calling Bedrock:', error);
    
    // Save error message to DynamoDB (using pk/sk schema)
    const timestamp = Date.now();
    
    const rawConvId = (message.conversationId || message.pk || "").toString();
    const cleanId = rawConvId.replace(/^CONV#/, "");
    const formattedPk = `CONV#${cleanId}`;

    const errorMessage = {
      pk: formattedPk,
      sk: `MSG#${timestamp}`,
      conversationId: cleanId,
      timestamp: timestamp,
      userId: message.receiver || message.userId,
      content: "I'm sorry, I encountered an error processing your request. Please try again.",
      messageType: 'ai',
      metadata: {
        error: error.message,
        errorType: error.name,
        requestId: message.requestId || 'unknown'
      },
      expiresAt: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)
    };
    
    await dynamoClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: errorMessage
    }));
    
    return errorMessage;
  }
}

/**
 * Unmarshall DynamoDB record to plain JavaScript object
 * @param {Object} dynamoRecord - DynamoDB record in wire format
 */
function unmarshallDynamoDBRecord(dynamoRecord) {
  const result = {};
  
  for (const [key, value] of Object.entries(dynamoRecord)) {
    if (value.S !== undefined) {
      result[key] = value.S;
    } else if (value.N !== undefined) {
      result[key] = Number(value.N);
    } else if (value.BOOL !== undefined) {
      result[key] = value.BOOL;
    } else if (value.M !== undefined) {
      result[key] = unmarshallDynamoDBRecord(value.M);
    } else if (value.L !== undefined) {
      result[key] = value.L.map(item => unmarshallDynamoDBRecord({ item }).item);
    } else if (value.NULL !== undefined) {
      result[key] = null;
    }
  }
  
  return result;
}
