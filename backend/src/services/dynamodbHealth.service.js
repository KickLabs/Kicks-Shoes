import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const resolveAwsRegion = () => {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '';
};

const getRequiredConfig = () => {
  const region = resolveAwsRegion();
  const tableName = process.env.DYNAMODB_TABLE_NAME || '';

  if (!region) {
    throw new Error('Missing AWS region. Set AWS_REGION or AWS_DEFAULT_REGION.');
  }

  if (!tableName) {
    throw new Error('Missing DYNAMODB_TABLE_NAME environment variable.');
  }

  return { region, tableName };
};

const createDocClient = region => {
  const baseClient = new DynamoDBClient({ region });
  return DynamoDBDocumentClient.from(baseClient, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
};

export const runDynamoDbHealthCheck = async () => {
  const { region, tableName } = getRequiredConfig();
  const docClient = createDocClient(region);

  const now = Date.now();
  const requestId = `${now}-${Math.random().toString(36).slice(2, 10)}`;
  const key = {
    pk: 'health#dynamodb',
    sk: `request#${requestId}`,
  };

  const item = {
    ...key,
    service: 'backend',
    status: 'ok',
    checkedAt: new Date(now).toISOString(),
    ttl: Math.floor(now / 1000) + 86400,
  };

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );

  const readResult = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: key,
      ConsistentRead: true,
    })
  );

  return {
    tableName,
    region,
    key,
    writeSucceeded: true,
    readSucceeded: Boolean(readResult.Item),
    checkedAt: item.checkedAt,
  };
};
