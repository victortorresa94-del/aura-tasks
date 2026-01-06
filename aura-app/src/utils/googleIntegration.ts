// Google Integration Utility
// Handles Auth, Drive, Gmail, and Calendar interactions

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

// Configuration
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

// Scopes required for the application
const SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
].join(' ');

// Discovery docs for the APIs we use
const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
];

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// --- INITIALIZATION ---

export const loadGoogleScripts = (onLoad: () => void) => {
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.async = true;
    script1.defer = true;
    script1.onload = () => {
        window.gapi.load('client', async () => {
            try {
                await window.gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: DISCOVERY_DOCS,
                });
                gapiInited = true;
                if (gisInited) onLoad();
            } catch (error) {
                console.error("Error initializing GAPi client", error);
            }
        });
    };
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.async = true;
    script2.defer = true;
    script2.onload = () => {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // Defined dynamically in handleAuthClick
        });
        gisInited = true;
        if (gapiInited) onLoad();
    };
    document.body.appendChild(script2);
};

// --- AUTHENTICATION ---

export const handleAuthClick = (callback: (response: any) => void) => {
    if (!tokenClient) return;

    tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        callback(resp);
    };

    if (window.gapi.client.getToken() === null) {
        // New login, request consent
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Existing session
        tokenClient.requestAccessToken({ prompt: '' });
    }
};

export const checkSession = () => {
    return window.gapi && window.gapi.client.getToken() !== null;
};

export const signOut = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
        window.google.accounts.oauth2.revoke(token.access_token);
        window.gapi.client.setToken('');
    }
};

// --- GOOGLE DRIVE ---

export const listDriveFiles = async (folderId: string = 'root') => {
    try {
        const response = await window.gapi.client.drive.files.list({
            'pageSize': 20,
            'fields': 'nextPageToken, files(id, name, mimeType, size, webViewLink, iconLink, thumbnailLink)',
            'q': `'${folderId}' in parents and trashed = false`
        });
        return response.result.files;
    } catch (err) {
        console.error("Error listing Drive files", err);
        return [];
    }
};

export const mapMimeTypeToAuraType = (mimeType: string): any => {
    if (mimeType.includes('folder')) return 'folder';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('spreadsheet') || mimeType.includes('sheet')) return 'sheet';
    if (mimeType.includes('presentation') || mimeType.includes('slide')) return 'slide';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'doc';
    return 'doc';
};

// --- GMAIL ---

export interface GmailMessage {
    id: string;
    threadId: string;
    snippet: string;
    payload?: any;
    from?: string;
    subject?: string;
    date?: string;
}

export const listEmails = async (maxResults: number = 10): Promise<GmailMessage[]> => {
    try {
        const response = await window.gapi.client.gmail.users.messages.list({
            'userId': 'me',
            'maxResults': maxResults,
            'labelIds': ['INBOX']
        });

        const messages = response.result.messages || [];
        const fullMessages = await Promise.all(messages.map(async (msg: any) => {
            const details = await window.gapi.client.gmail.users.messages.get({
                'userId': 'me',
                'id': msg.id
            });
            const headers = details.result.payload.headers;
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
            const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';

            return {
                id: msg.id,
                threadId: msg.threadId,
                snippet: details.result.snippet,
                subject,
                from,
                date: headers.find((h: any) => h.name === 'Date')?.value
            };
        }));

        return fullMessages;

    } catch (err) {
        console.error("Error listing emails", err);
        return [];
    }
};

export const sendEmail = async (to: string, subject: string, body: string) => {
    // Simple text email construction
    const emailContent = `To: ${to}\r\n` +
        `Subject: ${subject}\r\n` +
        `Content-Type: text/plain; charset="UTF-8"\r\n\r\n` +
        `${body}`;

    const base64EncodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    try {
        await window.gapi.client.gmail.users.messages.send({
            'userId': 'me',
            'resource': {
                'raw': base64EncodedEmail
            }
        });
        return true;
    } catch (err) {
        console.error("Error sending email", err);
        throw err;
    }
};

// --- GOOGLE CALENDAR ---

export interface CalendarEvent {
    id: string;
    summary: string;
    start: { dateTime: string, date?: string };
    end: { dateTime: string, date?: string };
    description?: string;
    location?: string;
    htmlLink?: string;
}

export const listEvents = async (maxResults: number = 10): Promise<CalendarEvent[]> => {
    try {
        const response = await window.gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': maxResults,
            'orderBy': 'startTime'
        });
        return response.result.items;
    } catch (err) {
        console.error("Error listing calendar events", err);
        return [];
    }
};

// HELPER to check if config is present
export const hasGoogleConfig = () => {
    return CLIENT_ID.length > 0 && API_KEY.length > 0;
};
