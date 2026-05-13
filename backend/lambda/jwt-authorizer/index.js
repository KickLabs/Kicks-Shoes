/**
 * Lambda JWT Authorizer for API Gateway HTTP API
 *
 * Validates Bearer token from Authorization header.
 * Returns simple response format (isAuthorized: true/false).
 *
 * Reads JWT_SECRET from AWS Secrets Manager on cold start,
 * then caches it for subsequent invocations.
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import jwt from 'jsonwebtoken';

const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
});

// Cache secret to avoid Secrets Manager call on every invocation
let cachedSecret = null;

async function getJwtSecret() {
  if (cachedSecret) return cachedSecret;

  const command = new GetSecretValueCommand({
    SecretId: process.env.SECRET_NAME,
  });

  const response = await secretsClient.send(command);
  const secrets = JSON.parse(response.SecretString);
  cachedSecret = secrets.JWT_SECRET;
  return cachedSecret;
}

export const handler = async (event) => {
  console.log('Authorizer invoked, routeArn:', event.routeArn);

  try {
    const authHeader =
      event.headers?.authorization || event.headers?.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or malformed Authorization header');
      return { isAuthorized: false };
    }

    const token = authHeader.split(' ')[1];
    const secret = await getJwtSecret();

    const decoded = jwt.verify(token, secret);
    console.log('Token valid, userId:', decoded.id || decoded.sub);

    return {
      isAuthorized: true,
      context: {
        userId: String(decoded.id || decoded.sub || ''),
        email: decoded.email || '',
      },
    };
  } catch (error) {
    console.error('Authorization failed:', error.message);
    return { isAuthorized: false };
  }
};
