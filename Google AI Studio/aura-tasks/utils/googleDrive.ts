// GAPI and Google Identity Services types
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// CONFIGURATION
// IMPORTANTE: En un entorno real, esto debe ir en process.env.REACT_APP_GOOGLE_CLIENT_ID
// Para probarlo ahora, debes obtener un Client ID desde Google Cloud Console.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'TU_CLIENT_ID_DE_GOOGLE_CLOUD_AQUI'; 
const API_KEY = process.env.API_KEY || ''; // Usamos la misma API Key si tiene permisos de Drive, o crea una específica.
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const loadGoogleScripts = (onLoad: () => void) => {
  const script1 = document.createElement('script');
  script1.src = 'https://apis.google.com/js/api.js';
  script1.async = true;
  script1.defer = true;
  script1.onload = () => {
    window.gapi.load('client', async () => {
      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
      });
      gapiInited = true;
      if (gisInited) onLoad();
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
      callback: '', // Defined later
    });
    gisInited = true;
    if (gapiInited) onLoad();
  };
  document.body.appendChild(script2);
};

export const handleAuthClick = (callback: (response: any) => void) => {
  if (!tokenClient) return;
  
  tokenClient.callback = async (resp: any) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    callback(resp);
  };

  if (window.gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    // Skip display of account chooser and consent dialog for an existing session
    tokenClient.requestAccessToken({prompt: ''});
  }
};

export const listDriveFiles = async (folderId: string = 'root') => {
  try {
    const response = await window.gapi.client.drive.files.list({
      'pageSize': 20,
      'fields': 'nextPageToken, files(id, name, mimeType, size, webViewLink, iconLink, thumbnailLink)',
      'q': `'${folderId}' in parents and trashed = false`
    });
    return response.result.files;
  } catch (err) {
    console.error("Error listing files", err);
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

export const hasClientId = () => {
    return CLIENT_ID !== 'TU_CLIENT_ID_DE_GOOGLE_CLOUD_AQUI' && CLIENT_ID.length > 0;
};