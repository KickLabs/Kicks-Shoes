import express from 'express';
import { runDynamoDbHealthCheck } from '../services/dynamodbHealth.service.js';

const router = express.Router();

router.get('/dynamodb', async (req, res) => {
  try {
    const result = await runDynamoDbHealthCheck();

    return res.status(200).json({
      status: 'healthy',
      service: 'dynamodb',
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'unhealthy',
      service: 'dynamodb',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
