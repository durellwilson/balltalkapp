/**
 * Load Test Environment Variables
 * 
 * This script loads the test environment variables from .env.test
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load the test environment variables
const envPath = path.join(process.cwd(), '.env.test');
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('Error loading test environment variables:', result.error);
    process.exit(1);
  }
  console.log('Test environment variables loaded successfully');
} else {
  console.error('Test environment file not found:', envPath);
  console.error('Run "node scripts/local-test-environment.js" to create it');
  process.exit(1);
}
