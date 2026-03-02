const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TOKEN_PATH = path.join(__dirname, '..', '..', '..', 'data', 'tokens.json');

async function getAuthenticatedClient() {
  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('No token found. Run auth.js first.');
    process.exit(1);
  }
  
  const { OAuth2Client } = require('google-auth-library');
  const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'credentials.json'), 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  
  const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oAuth2Client.setCredentials(token);
  
  return oAuth2Client;
}

async function listEvents(daysAhead = 7) {
  const auth = await getAuthenticatedClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + daysAhead);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = (response.data.items || []).map(event => ({
    id: event.id,
    summary: event.summary || '(No title)',
    start: event.start.dateTime || event.start.date,
    end: event.end.dateTime || event.end.date,
    description: event.description || '',
    location: event.location || '',
  }));

  console.log(JSON.stringify(events, null, 2));
}

const command = process.argv[2];
const days = parseInt(process.argv[3]) || 7;

if (command === 'list') {
  listEvents(days).catch(console.error);
} else {
  console.log('Usage: node calendar.js list [daysAhead]');
}
