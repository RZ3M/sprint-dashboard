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

// Noise patterns - filter these out completely
const NOISE_PATTERNS = [
  'verification', '2-step', 'two-step', 'login attempt', 'new user created',
  'newsletter', 'e-statement', 'statement is available', 'your statement',
  'password', 'security', 'alerts', 'noreply', 'no-reply', 'notifications',
  'welcome to', 'thanks for signing', 'confirm your email', 'verify your email',
  'protect yourself', 'fake job', 'unsubscribe', 'membership auto renewal',
  'breaking', 'digest', 'update from', 'product update', 'whats new',
  'score up to', 'save on interest', 'transfer balances', 'spend more save more',
  'you\'ve been matched', 'see more in your feed', 'sign in notification',
  'rogers bank', 'triangle', 'credit card', 'ruize'
];

// Action keywords - things that need user action
const ACTION_KEYWORDS = {
  urgent: ['urgent', 'asap', 'deadline', 'action required', 'review', 'approve', 'interview', 'oa', 'offer', 'next steps', 'application status'],
  admin: ['reply', 'respond', 'calendar', 'meeting', 'schedule', 'rsvp', 'form', 'apply', 'application'],
  creative: ['project', 'code', 'build', 'create', 'design', 'write', 'brainstorm', 'idea']
};

function isNoise(task) {
  const text = (task.subject + ' ' + task.summary + ' ' + task.from + ' ' + (task.description || '')).toLowerCase();
  
  // Check for noise patterns
  if (NOISE_PATTERNS.some(pattern => text.includes(pattern))) {
    return true;
  }
  
  // Filter out calendar events that are routine (not work-related)
  if (task.type === 'calendar') {
    const routineEvents = ['morning routine', 'breakfast', 'lunch', 'dinner', 'walk', 'gym', 'shower', 'relax', 'skincare', 'study'];
    if (routineEvents.some(e => text.includes(e))) {
      return true;
    }
  }
  
  // Filter out generic LinkedIn job alerts (too generic)
  if (task.from?.includes('linkedin') && task.subject?.includes('job alert')) {
    return true;
  }
  
  // Filter out Instagram social stuff
  if (task.from?.includes('instagram') && task.subject?.includes('feed')) {
    return true;
  }
  
  return false;
}

function categorizeTask(task) {
  const text = (task.subject + ' ' + task.summary + ' ' + (task.description || '')).toLowerCase();
  
  // Check for urgent first (interviews, OAs, next steps)
  if (ACTION_KEYWORDS.urgent.some(k => text.includes(k))) {
    return 'urgent';
  }
  
  // Check for creative
  if (ACTION_KEYWORDS.creative.some(k => text.includes(k))) {
    return 'creative';
  }
  
  // Check for admin
  if (ACTION_KEYWORDS.admin.some(k => text.includes(k))) {
    return 'admin';
  }
  
  return null;
}

async function triage() {
  console.log('Fetching emails and calendar events...');
  
  // Get emails and events
  const emails = runScript('./skills/google-integrations/scripts/gmail.js', ['list', '30']);
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
  
  let noiseCount = 0;
  
  for (const task of tasks) {
    // Skip noise
    if (isNoise(task)) {
      noiseCount++;
      continue;
    }
    
    // Try to categorize
    const category = categorizeTask(task);
    if (category) {
      buckets[category].push(task);
    } else if (task.type === 'email') {
      // Uncategorized emails might be important - add to admin for review
      buckets.admin.push(task);
    }
  }
  
  console.log(`Filtered out ${noiseCount} noise items`);
  console.log(`Urgent: ${buckets.urgent.length}, Admin: ${buckets.admin.length}, Creative: ${buckets.creative.length}`);
  
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
