import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { docClient, CHAT_MESSAGES_TABLE } from '../config/dynamodb.js';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

export const findOrCreateConversation = async (userId, shopId) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, shopId] },
  });
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, shopId],
    });
  }
  return conversation;
};

export const saveMessage = async ({ conversationId, sender, receiver, content }) => {
  // Save to MongoDB (existing functionality)
  const message = await Message.create({
    conversationId,
    sender,
    receiver,
    content,
  });
  
  // Update last message in conversation
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: content,
    lastUpdated: Date.now(),
  });
  
  // Save to DynamoDB (new - triggers Lambda for Bedrock processing)
  try {
    const timestamp = Date.now();
    const dynamoMessage = {
      pk: `CONV#${conversationId.toString()}`,
      sk: `MSG#${timestamp}`,
      userId: sender.toString(),
      receiver: receiver.toString(),
      content: content,
      messageType: 'user',
      mongoId: message._id.toString(),
      createdAt: new Date().toISOString(),
      expiresAt: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)
    };
    
    await docClient.send(new PutCommand({
      TableName: CHAT_MESSAGES_TABLE,
      Item: dynamoMessage
    }));
    
    console.log('Message saved to DynamoDB:', {
      pk: `CONV#${conversationId}`,
      sk: `MSG#${timestamp}`,
      messageType: 'user'
    });
  } catch (dynamoError) {
    // Log error but don't fail the request
    // MongoDB save already succeeded
    console.error('Error saving to DynamoDB:', dynamoError);
    console.error('Message still saved to MongoDB successfully');
  }
  
  return message;
};

export const getConversationsByUser = async userId => {
  return Conversation.find({ participants: userId })
    .sort({ lastUpdated: -1 })
    .populate('participants', 'fullName username email avatar');
};

export const getMessagesByConversation = async conversationId => {
  return Message.find({ conversationId })
    .sort({ timestamp: 1 })
    .populate('sender', 'fullName username email avatar')
    .populate('receiver', 'fullName username email avatar');
};
