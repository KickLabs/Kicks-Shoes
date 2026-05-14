const { execSync } = require('child_process');

try {
  // Get current config
  console.log('Fetching config...');
  const output = execSync('aws lambda get-function-configuration --function-name kicks-shoes-dev-tientp-bedrock-chat --region us-east-1', { encoding: 'utf-8' });
  const config = JSON.parse(output);
  
  const env = config.Environment.Variables;
  console.log('Current table:', env.DYNAMODB_TABLE_NAME);
  
  // Update table name
  env.DYNAMODB_TABLE_NAME = 'kicks-shoes-chat-messages';
  
  // Write to temp file for CLI
  const fs = require('fs');
  fs.writeFileSync('env.json', JSON.stringify({ Variables: env }));
  
  console.log('Updating config...');
  execSync('aws lambda update-function-configuration --function-name kicks-shoes-dev-tientp-bedrock-chat --environment file://env.json --region us-east-1');
  
  console.log('Done!');
} catch (e) {
  console.error(e);
}
