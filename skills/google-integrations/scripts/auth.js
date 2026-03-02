const fs = require('fs');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');

const CREDENTIALS_PATH = path.join(__dirname, '..', '..', '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', '..', '..', 'data', 'tokens.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function main() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  
  const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

  // Check if we have a stored token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    
    // Check if token needs refresh
    if (oAuth2Client.isTokenExpiring()) {
      console.log('Token is expiring, refreshing...');
      const { credentials } = await oAuth2Client.refreshAccessToken();
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials));
      console.log('Token refreshed and saved.');
    } else {
      console.log('Token loaded from file.');
    }
  } else {
    // Get new token
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.readonly'
      ],
    });

    console.log('\nAuthorize this app by visiting this URL:');
    console.log(authUrl);
    console.log('\nThen enter the authorization code:');

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question('> ', async (code) => {
      readline.close();
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
      console.log('Token stored to', TOKEN_PATH);
    });
  }

  return oAuth2Client;
}

main().catch(console.error);
