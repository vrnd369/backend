const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const questions = [
  {
    name: 'MONGO_URI',
    message: 'Enter your MongoDB URI (default: mongodb://localhost:27017/ottoman): ',
    default: 'mongodb://localhost:27017/ottoman'
  },
  {
    name: 'EMAIL_USER',
    message: 'Enter your Gmail address: '
  },
  {
    name: 'EMAIL_PASS',
    message: 'Enter your Gmail App Password: '
  },
  {
    name: 'PORT',
    message: 'Enter port number (default: 5000): ',
    default: '5000'
  }
];

const envPath = path.join(__dirname, '.env');

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question.message, (answer) => {
      resolve(answer || question.default);
    });
  });
}

async function setup() {
  console.log('Setting up environment variables...\n');
  
  const answers = {};
  for (const question of questions) {
    answers[question.name] = await askQuestion(question);
  }

  const envContent = Object.entries(answers)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync(envPath, envContent);
  console.log('\nEnvironment variables have been set up successfully!');
  console.log('Please make sure to:');
  console.log('1. Enable 2-Step Verification in your Google Account');
  console.log('2. Generate an App Password for your Gmail account');
  console.log('3. Restart your server after setting up the environment variables');
  
  rl.close();
}

setup().catch(console.error); 