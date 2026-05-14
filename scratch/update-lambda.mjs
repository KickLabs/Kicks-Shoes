import { LambdaClient, GetFunctionConfigurationCommand, UpdateFunctionConfigurationCommand } from "@aws-sdk/client-lambda";

const client = new LambdaClient({ region: "us-east-1" });

async function update() {
  const getCmd = new GetFunctionConfigurationCommand({ FunctionName: "kicks-shoes-dev-tientp-bedrock-chat" });
  const config = await client.send(getCmd);
  
  const newEnv = { ...config.Environment.Variables };
  newEnv.DYNAMODB_TABLE_NAME = "kicks-shoes-chat-messages";
  
  const updateCmd = new UpdateFunctionConfigurationCommand({
    FunctionName: "kicks-shoes-dev-tientp-bedrock-chat",
    Environment: { Variables: newEnv }
  });
  await client.send(updateCmd);
  console.log("Lambda environment updated successfully!");
}

update().catch(console.error);
