/**
 * DynamoDB Controller
 * Handles queries to DynamoDB for chat messages (including AI responses)
 */

import { docClient, CHAT_MESSAGES_TABLE } from '../config/dynamodb.js';
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

/**
 * GET /api/dynamodb/messages/:conversationId
 * Get all messages for a conversation (including AI responses)
 */
export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, lastTimestamp } = req.query;
    
    if (!conversationId) {
      return res.status(400).json({ message: 'conversationId is required' });
    }
    
    console.log('Querying DynamoDB for conversation:', conversationId);
    
    // Query parameters using pk/sk schema
    const queryParams = {
      TableName: CHAT_MESSAGES_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': `CONV#${conversationId}`
      },
      Limit: parseInt(limit),
      ScanIndexForward: true // Sort by timestamp ascending (oldest first)
    };
    
    // Add pagination if lastTimestamp provided
    if (lastTimestamp) {
      queryParams.ExclusiveStartKey = {
        pk: `CONV#${conversationId}`,
        sk: `MSG#${lastTimestamp}`
      };
    }
    
    const command = new QueryCommand(queryParams);
    const result = await docClient.send(command);
    
    console.log('DynamoDB query returned', result.Items?.length || 0, 'messages');
    
    res.json({
      messages: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
      count: result.Items?.length || 0
    });
    
  } catch (error) {
    console.error('Error querying DynamoDB:', error);
    res.status(500).json({ 
      message: 'Error fetching messages from DynamoDB',
      error: error.message 
    });
  }
};

/**
 * GET /api/dynamodb/messages/:conversationId/ai
 * Get only AI responses for a conversation
 */
export const getAIResponses = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 20 } = req.query;
    
    if (!conversationId) {
      return res.status(400).json({ message: 'conversationId is required' });
    }
    
    console.log('Querying AI responses for conversation:', conversationId);
    
    const command = new QueryCommand({
      TableName: CHAT_MESSAGES_TABLE,
      KeyConditionExpression: 'pk = :pk',
      FilterExpression: 'messageType = :messageType',
      ExpressionAttributeValues: {
        ':pk': `CONV#${conversationId}`,
        ':messageType': 'ai'
      },
      Limit: parseInt(limit),
      ScanIndexForward: false // Sort by timestamp descending (newest first)
    });
    
    const result = await docClient.send(command);
    
    console.log('Found', result.Items?.length || 0, 'AI responses');
    
    res.json({
      messages: result.Items || [],
      count: result.Items?.length || 0
    });
    
  } catch (error) {
    console.error('Error querying AI responses:', error);
    res.status(500).json({ 
      message: 'Error fetching AI responses',
      error: error.message 
    });
  }
};

/**
 * GET /api/dynamodb/messages/:conversationId/latest
 * Get latest message (useful for polling)
 */
export const getLatestMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      return res.status(400).json({ message: 'conversationId is required' });
    }
    
    const command = new QueryCommand({
      TableName: CHAT_MESSAGES_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': `CONV#${conversationId}`
      },
      Limit: 1,
      ScanIndexForward: false // Get newest first
    });
    
    const result = await docClient.send(command);
    
    res.json({
      message: result.Items?.[0] || null
    });
    
  } catch (error) {
    console.error('Error getting latest message:', error);
    res.status(500).json({ 
      message: 'Error fetching latest message',
      error: error.message 
    });
  }
};

/**
 * GET /api/dynamodb/health
 * Health check for DynamoDB connection
 */
export const healthCheck = async (req, res) => {
  try {
    // Try a simple scan with limit 1
    const command = new ScanCommand({
      TableName: CHAT_MESSAGES_TABLE,
      Limit: 1
    });
    
    await docClient.send(command);
    
    res.json({
      status: 'healthy',
      table: CHAT_MESSAGES_TABLE,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('DynamoDB health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      table: CHAT_MESSAGES_TABLE,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

