/**
 * DynamoDB Service
 * Provides query operations using Global Secondary Indexes (GSI)
 * This demonstrates GSI Query for Week 3 Must-Have 1 requirement
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  QueryCommand, 
  PutCommand,
  GetCommand,
  UpdateCommand 
} from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Table name
const CHAT_MESSAGES_TABLE = process.env.DYNAMODB_CHAT_TABLE || 'kicks-shoes-chat-messages';

/**
 * GSI Query Example 1: Query messages by userId
 * Uses: UserMessagesIndex (GSI)
 * Evidence for Must-Have 1: GSI Query operation
 * 
 * @param {string} userId - User ID to query
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<Array>} Array of messages
 */
export async function queryUserMessages(userId, limit = 50) {
  console.log('🔍 GSI Query: UserMessagesIndex for userId:', userId);
  
  try {
    const command = new QueryCommand({
      TableName: CHAT_MESSAGES_TABLE,
      IndexName: 'UserMessagesIndex',  // ← GSI Query Evidence
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Sort descending (newest first)
      Limit: limit,
    });

    const response = await docClient.send(command);
    
    console.log('✅ GSI Query successful:', {
      indexName: 'UserMessagesIndex',
      itemsReturned: response.Items?.length || 0,
      scannedCount: response.ScannedCount,
    });

    return response.Items || [];
  } catch (error) {
    console.error('❌ GSI Query failed:', error);
    throw error;
  }
}

/**
 * GSI Query Example 2: Query messages by type (user/ai)
 * Uses: MessageTypeIndex (GSI)
 * Evidence for Must-Have 1: Second GSI Query operation
 * 
 * @param {string} messageType - Message type ('user' or 'ai')
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<Array>} Array of messages
 */
export async function queryMessagesByType(messageType, limit = 100) {
  console.log('🔍 GSI Query: MessageTypeIndex for type:', messageType);
  
  try {
    const command = new QueryCommand({
      TableName: CHAT_MESSAGES_TABLE,
      IndexName: 'MessageTypeIndex',  // ← GSI Query Evidence
      KeyConditionExpression: 'messageType = :type',
      ExpressionAttributeValues: {
        ':type': messageType,
      },
      ScanIndexForward: false, // Sort descending (newest first)
      Limit: limit,
    });

    const response = await docClient.send(command);
    
    console.log('✅ GSI Query successful:', {
      indexName: 'MessageTypeIndex',
      itemsReturned: response.Items?.length || 0,
      scannedCount: response.ScannedCount,
    });

    return response.Items || [];
  } catch (error) {
    console.error('❌ GSI Query failed:', error);
    throw error;
  }
}

/**
 * Primary Key Query: Get messages by conversation
 * Uses: Primary key (conversationId + timestamp)
 * 
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<Array>} Array of messages
 */
export async function queryConversationMessages(conversationId, limit = 100) {
  console.log('🔍 Primary Key Query for conversationId:', conversationId);
  
  try {
    const command = new QueryCommand({
      TableName: CHAT_MESSAGES_TABLE,
      KeyConditionExpression: 'conversationId = :convId',
      ExpressionAttributeValues: {
        ':convId': conversationId,
      },
      ScanIndexForward: true, // Sort ascending (oldest first)
      Limit: limit,
    });

    const response = await docClient.send(command);
    
    console.log('✅ Primary Key Query successful:', {
      itemsReturned: response.Items?.length || 0,
    });

    return response.Items || [];
  } catch (error) {
    console.error('❌ Primary Key Query failed:', error);
    throw error;
  }
}

/**
 * Put item to DynamoDB
 * 
 * @param {Object} item - Item to put
 * @returns {Promise<Object>} Put result
 */
export async function putMessage(item) {
  try {
    const command = new PutCommand({
      TableName: CHAT_MESSAGES_TABLE,
      Item: item,
    });

    await docClient.send(command);
    console.log('✅ Message saved to DynamoDB');
    return item;
  } catch (error) {
    console.error('❌ Failed to save message:', error);
    throw error;
  }
}

/**
 * Get single item by primary key
 * 
 * @param {string} conversationId - Conversation ID
 * @param {number} timestamp - Message timestamp
 * @returns {Promise<Object>} Message item
 */
export async function getMessage(conversationId, timestamp) {
  try {
    const command = new GetCommand({
      TableName: CHAT_MESSAGES_TABLE,
      Key: {
        conversationId,
        timestamp,
      },
    });

    const response = await docClient.send(command);
    return response.Item;
  } catch (error) {
    console.error('❌ Failed to get message:', error);
    throw error;
  }
}

/**
 * Update message metadata
 * 
 * @param {string} conversationId - Conversation ID
 * @param {number} timestamp - Message timestamp
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated item
 */
export async function updateMessage(conversationId, timestamp, updates) {
  try {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((key, index) => {
      const placeholder = `#field${index}`;
      const valuePlaceholder = `:value${index}`;
      updateExpression.push(`${placeholder} = ${valuePlaceholder}`);
      expressionAttributeNames[placeholder] = key;
      expressionAttributeValues[valuePlaceholder] = updates[key];
    });

    const command = new UpdateCommand({
      TableName: CHAT_MESSAGES_TABLE,
      Key: {
        conversationId,
        timestamp,
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const response = await docClient.send(command);
    return response.Attributes;
  } catch (error) {
    console.error('❌ Failed to update message:', error);
    throw error;
  }
}

/**
 * Health check for DynamoDB connection
 * 
 * @returns {Promise<boolean>} Connection status
 */
export async function checkDynamoDBHealth() {
  try {
    const { ListTablesCommand } = await import('@aws-sdk/client-dynamodb');
    await client.send(new ListTablesCommand({ Limit: 1 }));
    return true;
  } catch (error) {
    console.error('❌ DynamoDB health check failed:', error);
    return false;
  }
}

// Export client for advanced usage
export { docClient, CHAT_MESSAGES_TABLE };
