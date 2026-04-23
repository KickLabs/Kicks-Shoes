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
  
  const results = [];
  
  try {
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
      
      // Process message with Bedrock
      const result = await processMessageWithBedrock(message);
      results.push(result);
    }
    
    console.log('Successfully processed', results.length, 'messages');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed messages',
        processed: results.length,
        results: results
      })
    };
    
  } catch (error) {
    console.error('Error processing messages:', error);
    
    // Log error details for debugging
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
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
    let modelArn = process.env.BEDROCK_MODEL || 'amazon.nova-2-lite-v1:0';
    
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
    const response = await bedrockClient.send(command);
    const responseTime = Date.now() - startTime;
    
    console.log('Bedrock response received in', responseTime, 'ms');
    console.log('Response citations:', response.citations?.length || 0);
    
    // Extract AI response text
    const aiResponseText = response.output?.text || "I couldn't generate a response.";
    
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
    
    return {
      success: true,
      conversationId: message.conversationId,
      responseTime: responseTime,
      aiResponse: aiResponseText.substring(0, 100) + '...' // Log preview only
    };
    
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
    
    return {
      success: false,
      conversationId: message.conversationId,
      error: error.message
    };
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
