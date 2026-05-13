/**
 * DynamoDB Configuration
 * Handles connection to AWS DynamoDB for chat messages
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  // Credentials are automatically loaded from:
  // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  // 2. IAM role (when running on ECS/EC2)
  // 3. AWS credentials file (~/.aws/credentials)
});

// Create Document Client for easier data manipulation
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true, // Remove undefined values
    convertEmptyValues: false, // Don't convert empty strings to null
  },
  unmarshallOptions: {
    wrapNumbers: false, // Return numbers as JavaScript numbers
  },
});

// Table name from environment variable
export const CHAT_MESSAGES_TABLE = process.env.DYNAMODB_CHAT_TABLE || 'kicks-shoes-chat-messages';

// Export clients
export { client as dynamoClient, docClient };

// Health check function
export async function checkDynamoDBConnection() {
  try {
    const { ListTablesCommand } = await import('@aws-sdk/client-dynamodb');
    await client.send(new ListTablesCommand({ Limit: 1 }));
    return true;
  } catch (error) {
    console.error('DynamoDB connection error:', error);
    return false;
  }
}
