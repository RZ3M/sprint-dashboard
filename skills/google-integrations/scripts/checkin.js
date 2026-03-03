const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SPRINT_DATA_PATH = path.join(__dirname, '..', '..', '..', 'data', 'sprints.json');
const USER_STATE_PATH = path.join(__dirname, '..', '..', '..', 'data', 'user-state.json');

// Run triage first
function runTriage() {
  console.log('Running triage...');
  execSync('node skills/google-integrations/scripts/triage.js run', { 
    cwd: path.join(__dirname, '..', '..', '..'),
    stdio: 'pipe'
  });
}

// Load current sprint data
function loadSprintData() {
  if (fs.existsSync(SPRINT_DATA_PATH)) {
    return JSON.parse(fs.readFileSync(SPRINT_DATA_PATH, 'utf8'));
  }
  return { urgent: [], admin: [], creative: [] };
}

function getCheckInMessage() {
  const data = loadSprintData();
  
  let message = `⚡ **Energy Check-in**\n\n`;
  message += `📊 *Today's Tasks:*\n`;
  message += `• Urgent: ${data.urgent.length}\n`;
  message += `• Admin: ${data.admin.length}\n`;
  message += `• Creative: ${data.creative.length}\n\n`;
  
  if (data.urgent.length > 0) {
    message += `🎯 **Priority:** ${top.subject || top.summary || data.urgent}\n\n`;
  }
  
  message += `How's your energy? React with:\n`;
  message += `🟢 High → Creative sprint\n`;
  message += `🟡 Medium → Your pick\n`;
  message += `🔴 Low → Admin sprint`;
  
  return message;
}

// Main
if (process.argv[2] === 'run') {
  runTriage();
  console.log(getCheckInMessage());
} else {
  console.log('Usage: node checkin.js run');
  console.log('\nThis script:');
  console.log('1. Runs triage to update sprint buckets');
  console.log('2. Outputs a Discord-ready message');
  console.log('\nUse with OpenClaw cron to send to Discord');
}
