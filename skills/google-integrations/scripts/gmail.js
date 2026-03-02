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

async function listEmails(limit = 10) {
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: limit,
  });

  const messages = response.data.messages || [];
  const emails = [];

  for (const msg of messages) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'Date', 'Importance'],
    });

    const headers = detail.data.payload.headers;
    const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

    emails.push({
      id: msg.id,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      date: getHeader('Date'),
      importance: getHeader('Importance'),
    });
  }

  console.log(JSON.stringify(emails, null, 2));
}

const command = process.argv[2];
const limit = parseInt(process.argv[3]) || 10;

if (command === 'list') {
  listEmails(limit).catch(console.error);
} else {
  console.log('Usage: node gmail.js list [limit]');
}
