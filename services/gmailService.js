const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('@google-cloud/local-auth');

// Scopes for Gmail API
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify'
];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.promises.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 */
async function saveCredentials(client) {
    const content = await fs.promises.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.promises.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }

    // Check if credentials.json exists, if so use it
    if (fs.existsSync(CREDENTIALS_PATH)) {
        client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
        });
    } else if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET) {
        // Fallback to .env variables
        const { OAuth2 } = google.auth;
        client = new OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/oauth2callback'
        );

        // This flow is trickier because we need to generate an auth URL and get the code.
        // authenticate() handles this automatically with a local server.
        // We can try to use authenticate() with a constructed object, but it asks for keyfilePath.

        // Actually, @google-cloud/local-auth makes it hard to pass raw keys. 
        // Best approach: create a temporary credentials.json from env vars if it doesn't exist.

        const payload = {
            installed: {
                client_id: process.env.GMAIL_CLIENT_ID,
                project_id: "quickstart-123", // Dummy
                auth_uri: "https://accounts.google.com/o/oauth2/auth",
                token_uri: "https://oauth2.googleapis.com/token",
                auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
                client_secret: process.env.GMAIL_CLIENT_SECRET,
                redirect_uris: ["http://localhost:3000/oauth2callback"]
            }
        };
        await fs.promises.writeFile(CREDENTIALS_PATH, JSON.stringify(payload, null, 2));

        // Now call verify again
        client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
        });
    } else {
        throw new Error("Missing credentials.json AND .env variables.");
    }

    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

async function listUnreadMessages(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults: 10, // Process in batches
    });
    return res.data.messages || [];
}

async function getMessage(auth, id) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.get({
        userId: 'me',
        id: id,
    });
    return res.data;
}

async function createDraft(auth, messageDetails, htmlContent, attachments = []) {
    const gmail = google.gmail({ version: 'v1', auth });

    const subject = messageDetails.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const to = messageDetails.payload.headers.find(h => h.name === 'From')?.value;
    const references = messageDetails.payload.headers.find(h => h.name === 'References')?.value || messageDetails.payload.headers.find(h => h.name === 'Message-ID')?.value;

    let messageBody = '';

    if (attachments.length > 0) {
        const boundary = "drafter_boundary_" + Date.now();

        const headers = [
            `To: ${to}`,
            `Subject: Re: ${subject}`,
            `In-Reply-To: ${references}`,
            `References: ${references}`,
            'MIME-Version: 1.0',
            `Content-Type: multipart/related; boundary="${boundary}"`
        ];

        messageBody = headers.join('\r\n') + '\r\n\r\n';

        // HTML Part
        messageBody += `--${boundary}\r\n`;
        messageBody += 'Content-Type: text/html; charset=UTF-8\r\n\r\n';
        messageBody += `<html><body>${htmlContent}</body></html>\r\n\r\n`;

        // Attachments
        for (const att of attachments) {
            try {
                const content = fs.readFileSync(att.path).toString('base64');
                messageBody += `--${boundary}\r\n`;
                messageBody += `Content-Type: ${att.contentType}\r\n`;
                messageBody += 'Content-Transfer-Encoding: base64\r\n';
                messageBody += `Content-ID: <${att.cid}>\r\n\r\n`;
                messageBody += content + '\r\n\r\n';
            } catch (err) {
                console.error(`Failed to read attachment ${att.path}:`, err);
            }
        }

        messageBody += `--${boundary}--`;

    } else {
        // Simple HTML email
        const headers = [
            `To: ${to}`,
            `Subject: Re: ${subject}`,
            `In-Reply-To: ${references}`,
            `References: ${references}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0'
        ];
        messageBody = headers.join('\r\n') + '\r\n\r\n' + htmlContent;
    }

    const encodedEmail = Buffer.from(messageBody).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
            message: {
                raw: encodedEmail,
                threadId: messageDetails.threadId
            }
        }
    });
    return res.data;
}

async function markAsRead(auth, messageId) {
    const gmail = google.gmail({ version: 'v1', auth });
    await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
            removeLabelIds: ['UNREAD']
        }
    });
}

/**
 * Get the user's email profile
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function getProfile(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.getProfile({ userId: 'me' });
    return res.data;
}

module.exports = {
    authorize,
    listUnreadMessages,
    getMessage,
    createDraft,
    markAsRead,
    getProfile
};
