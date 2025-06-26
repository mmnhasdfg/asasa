const fs = require('fs');
const path = require('path');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Setting up environment variables...');
console.log('This will create a .env file with your OpenRouter API keys.');

const envVars = [
  'VITE_OPENROUTER_API_KEY',
  'VITE_OPENROUTER_API_KEY_2',
  'VITE_OPENROUTER_API_KEY_3',
  'VITE_OPENROUTER_API_KEY_4',
  'VITE_OPENROUTER_API_KEY_5',
  'VITE_OPENROUTER_API_KEY_6'
];

const envContent = [];

const askForKey = (index) => {
  if (index >= envVars.length) {
    // Write to .env file
    const envPath = path.join(__dirname, '.env');
    fs.writeFileSync(envPath, envContent.join('\n'));
    console.log('\n✅ .env file created successfully!');
    console.log('You can now start the development server with: npm run dev');
    readline.close();
    return;
  }

  const varName = envVars[index];
  readline.question(`Enter your ${varName}: `, (value) => {
    envContent.push(`${varName}=${value}`);
    askForKey(index + 1);
  });
};

// Start the process
askForKey(0);
