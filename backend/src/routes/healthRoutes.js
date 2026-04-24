import express from 'express';
import { runDynamoDbHealthCheck } from '../services/dynamodbHealth.service.js';
import { testS3Connection } from '../config/s3.js';

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

router.get('/s3', async (req, res) => {
  try {
    const isConnected = await testS3Connection();

    if (isConnected) {
      return res.status(200).json({
        status: 'healthy',
        service: 's3',
        bucket: process.env.AWS_S3_BUCKET || 'kicks-shoes-uploads',
        region: process.env.AWS_REGION || 'ap-southeast-1',
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new Error('S3 connection failed');
    }
  } catch (error) {
    return res.status(500).json({
      status: 'unhealthy',
      service: 's3',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/aws', async (req, res) => {
  try {
    const [s3Result, dynamoResult] = await Promise.allSettled([
      testS3Connection(),
      runDynamoDbHealthCheck(),
    ]);

    const s3Status = s3Result.status === 'fulfilled' && s3Result.value;
    const dynamoStatus = dynamoResult.status === 'fulfilled';

    return res.status(200).json({
      status: s3Status && dynamoStatus ? 'healthy' : 'partial',
      services: {
        s3: {
          status: s3Status ? 'healthy' : 'unhealthy',
          error: s3Result.status === 'rejected' ? s3Result.reason?.message : null,
        },
        dynamodb: {
          status: dynamoStatus ? 'healthy' : 'unhealthy',
          error: dynamoResult.status === 'rejected' ? dynamoResult.reason?.message : null,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
