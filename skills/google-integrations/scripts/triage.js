const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SPRINT_DATA_PATH = path.join(__dirname, '..', '..', '..', 'data', 'sprints.json');

// Helper to run scripts and get JSON output
function runScript(scriptPath, args = []) {
  const cmd = `node ${scriptPath} ${args.join(' ')}`;
  const output = execSync(cmd, { cwd: path.join(__dirname, '..', '..', '..') });
  return JSON.parse(output.toString());
}

async function triage() {
  console.log('Fetching emails and calendar events...');
  
  // Get emails and events
  const emails = runScript('./skills/google-integrations/scripts/gmail.js', ['list', '20']);
  const events = runScript('./skills/google-integrations/scripts/calendar.js', ['list', '3']);
  
  // Combine into tasks
  const tasks = [
    ...emails.map(e => ({ type: 'email', ...e })),
    ...events.map(e => ({ type: 'calendar', ...e }))
  ];
  
  // Sprint buckets
  const buckets = {
    urgent: [],
    admin: [],
    creative: []
  };
  
  // Simple keyword-based triage (can be upgraded to LLM later)
  const keywords = {
    urgent: ['urgent', 'asap', 'deadline', 'emergency', 'important', 'review', 'approve', 'action required'],
    admin: ['meeting', 'calendar', 'invite', 'reply', 'update', 'newsletter', 'notification', 'verification'],
    creative: ['idea', 'project', 'design', 'code', 'build', 'create', 'write', 'brainstorm']
  };
  
  for (const task of tasks) {
    const text = (task.subject + ' ' + task.summary + ' ' + task.from).toLowerCase();
    
    let assigned = 'admin'; // default
    
    if (keywords.urgent.some(k => text.includes(k))) {
      assigned = 'urgent';
    } else if (keywords.creative.some(k => text.includes(k))) {
      assigned = 'creative';
    }
    
    buckets[assigned].push(task);
  }
  
  // Save to file
  fs.writeFileSync(SPRINT_DATA_PATH, JSON.stringify(buckets, null, 2));
  console.log('Sprint buckets saved.');
  console.log(JSON.stringify(buckets, null, 2));
}

if (process.argv[2] === 'run') {
  triage().catch(console.error);
} else {
  console.log('Usage: node triage.js run');
}
