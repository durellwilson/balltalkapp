const fs = require('fs');
const path = require('path');

// Path to the GitHub Actions workflow file
const workflowFilePath = path.join(__dirname, '../.github/workflows/audio-processing-ci.yml');

// Read the file
let workflowContent = fs.readFileSync(workflowFilePath, 'utf8');

// Define the environment variables section that needs to be fixed
const envVarsToFix = [
  'EXPO_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}',
  'EXPO_PUBLIC_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}',
  'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: ${{ secrets.FIREBASE_MEASUREMENT_ID }}',
  'EXPO_PUBLIC_FIREBASE_DATABASE_URL: ${{ secrets.FIREBASE_DATABASE_URL }}',
  'EXPO_PUBLIC_DOLBY_API_KEY: ${{ secrets.DOLBY_API_KEY }}',
  'EXPO_PUBLIC_DOLBY_API_SECRET: ${{ secrets.DOLBY_API_SECRET }}'
];

// Create a section with environment variables that use default values if secrets are not available
const fixedEnvVars = envVarsToFix.map(envVar => {
  const [key, value] = envVar.split(': ');
  const secretName = value.match(/\${{ secrets\.([A-Z_]+) }}/)[1];
  return `          ${key}: \${{ secrets.${secretName} || '' }}`;
}).join('\n');

// Replace the environment variables section in the workflow file
const envVarsPattern = envVarsToFix.join('\n').replace(/\$/g, '\\$').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
workflowContent = workflowContent.replace(envVarsPattern, fixedEnvVars);

// Write the fixed content back to the file
fs.writeFileSync(workflowFilePath, workflowContent);

console.log(`Fixed GitHub Actions workflow file: ${workflowFilePath}`);

// Create a .env.example file with the required environment variables
const envExamplePath = path.join(__dirname, '../.env.example');
const envExampleContent = `# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=your-database-url

# Dolby.io API Configuration
EXPO_PUBLIC_DOLBY_API_KEY=your-dolby-api-key
EXPO_PUBLIC_DOLBY_API_SECRET=your-dolby-api-secret

# Audio Processing Configuration
EXPO_PUBLIC_USE_MOCK_DOLBY=true
EXPO_PUBLIC_DEFAULT_TARGET_LOUDNESS=-14
`;

fs.writeFileSync(envExamplePath, envExampleContent);
console.log(`Created .env.example file: ${envExamplePath}`);

// Create a README section about GitHub Actions secrets
const readmePath = path.join(__dirname, '../README.md');
let readmeContent = '';

if (fs.existsSync(readmePath)) {
  readmeContent = fs.readFileSync(readmePath, 'utf8');
}

const secretsSection = `
## GitHub Actions Secrets

The following secrets need to be set in your GitHub repository settings for the CI/CD workflow to function properly:

| Secret Name | Description |
|-------------|-------------|
| \`FIREBASE_API_KEY\` | Firebase API key |
| \`FIREBASE_AUTH_DOMAIN\` | Firebase authentication domain |
| \`FIREBASE_PROJECT_ID\` | Firebase project ID |
| \`FIREBASE_STORAGE_BUCKET\` | Firebase storage bucket |
| \`FIREBASE_MESSAGING_SENDER_ID\` | Firebase messaging sender ID |
| \`FIREBASE_APP_ID\` | Firebase app ID |
| \`FIREBASE_MEASUREMENT_ID\` | Firebase measurement ID |
| \`FIREBASE_DATABASE_URL\` | Firebase database URL |
| \`DOLBY_API_KEY\` | Dolby.io API key |
| \`DOLBY_API_SECRET\` | Dolby.io API secret |
| \`FIREBASE_TOKEN\` | Firebase CLI token for deployment |
| \`FIREBASE_SERVICE_ACCOUNT\` | Firebase service account JSON (base64 encoded) |
| \`SLACK_WEBHOOK\` | Slack webhook URL for notifications |

To set up these secrets:
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click on "New repository secret"
4. Add each secret with its corresponding value
`;

if (!readmeContent.includes('## GitHub Actions Secrets')) {
  if (readmeContent.trim() === '') {
    readmeContent = `# BallTalk App${secretsSection}`;
  } else {
    readmeContent += secretsSection;
  }
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`Updated README.md with GitHub Actions secrets information: ${readmePath}`);
} else {
  console.log('README.md already contains GitHub Actions secrets information');
} 