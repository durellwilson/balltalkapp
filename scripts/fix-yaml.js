const fs = require('fs');
const path = require('path');

// Path to the YAML file
const yamlFilePath = path.join(__dirname, '../.github/workflows/audio-processing-ci.yml');

// Read the file
let yamlContent = fs.readFileSync(yamlFilePath, 'utf8');

// Fix the problematic line
yamlContent = yamlContent.replace(
  /SLACK_MESSAGE: 'Audio Processing module has been deployed to \${{ github\.event\.inputs\.environment \|\| 'development' }} :rocket:'/g,
  'SLACK_MESSAGE: "Audio Processing module has been deployed to ${{ github.event.inputs.environment || \'development\' }} :rocket:"'
);

// Write the fixed content back to the file
fs.writeFileSync(yamlFilePath, yamlContent);

console.log(`Fixed YAML syntax error in: ${yamlFilePath}`); 