const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const chromium = require('@sparticuz/chromium');

const app = express();
const port = 3001;

// CORS ve Body Parser
const corsOptions = {
  origin: function (origin, callback) {
    // Reflect the requesting origin to bypass any strict string matching issues.
    callback(null, origin || '*');
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // explicitly handle preflight for all paths
app.use(express.json());

// Upload settings for Multer (Temp directory)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safeBase = (file.originalname || 'teklif')
        .replace(/[^a-zA-Z0-9-_\.]/g, '_')
        .replace(/\.pdf$/i, '');
      cb(null, `${Date.now()}_${safeBase}.pdf`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname || '')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF files are allowed'));
  },
});

// WhatsApp State
let qrCodeDataUrl = null;
let clientStatus = 'INITIALIZING'; // INITIALIZING, QR_READY, AUTHENTICATED, READY, DISCONNECTED
let client = null;
let isInitializing = false;

// Simple JSON Database for cross-device sync
const DB_FILE = path.join(__dirname, 'db.json');

app.get('/api/db', (req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      res.json(JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')));
    } else {
      res.json({});
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/db', (req, res) => {
  try {
    const data = req.body;
    let currentDb = {};
    if (fs.existsSync(DB_FILE)) {
      currentDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
    const newDb = { ...currentDb, ...data };
    fs.writeFileSync(DB_FILE, JSON.stringify(newDb));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
let isIntentionalLogout = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_BACKOFF_MS = 30000;

const getBackoffMs = () => Math.min(2000 * Math.max(1, reconnectAttempts), MAX_BACKOFF_MS);

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const buildClient = async () => new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
  authTimeoutMs: 60000,
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
  },
  puppeteer: {
    headless: chromium.headless,
    dumpio: true,
    executablePath: await chromium.executablePath(),
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
  }
});

const scheduleReconnect = (reason = 'unknown') => {
  if (isInitializing || reconnectTimer) return;
  reconnectAttempts += 1;
  clientStatus = 'DISCONNECTED';
  const delay = getBackoffMs();
  console.warn(`Scheduling WhatsApp reconnect in ${delay}ms. Reason: ${reason}`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    initializeClient(`reconnect:${reason}`);
  }, delay);
};

const registerClientEvents = (instance) => {
  instance.on('qr', async (qr) => {
    console.log('QR RECEIVED');
    try {
      qrCodeDataUrl = await qrcode.toDataURL(qr);
      clientStatus = 'QR_READY'; // Set status only AFTER QR code string is generated
    } catch (err) {
      console.error('QR Generate Error:', err);
    }
  });

  instance.on('ready', () => {
    console.log('Client is ready!');
    clientStatus = 'READY';
    qrCodeDataUrl = null;
    reconnectAttempts = 0;
    clearReconnectTimer();
  });

  instance.on('authenticated', () => {
    console.log('AUTHENTICATED');
    clientStatus = 'AUTHENTICATED';
  });

  instance.on('auth_failure', (message) => {
    console.error('AUTH FAILURE:', message);
    clientStatus = 'DISCONNECTED';
    scheduleReconnect('auth_failure');
  });

  instance.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    clientStatus = 'DISCONNECTED';
    if (!isIntentionalLogout) {
      scheduleReconnect(`disconnected:${reason}`);
    }
  });
};

const isDetachedFrameError = (error) => {
  const msg = String(error?.message || error || '').toLowerCase();
  return msg.includes('detached frame') || msg.includes('execution context was destroyed');
};

const initializeClient = async (trigger = 'startup') => {
  if (isInitializing) return;
  isInitializing = true;
  clearReconnectTimer();
  clientStatus = 'INITIALIZING';
  qrCodeDataUrl = null;

  try {
    if (client) {
      try { await client.destroy(); } catch (_) {}
    }
    client = await buildClient();
    registerClientEvents(client);
    await client.initialize();
    console.log(`WhatsApp initialize started (${trigger})`);
  } catch (err) {
    console.error('Initialize Error:', err?.message || err);
    const msg = String(err?.message || err || '').toLowerCase();
    if (msg.includes('detached frame') || msg.includes('execution context was destroyed')) {
      scheduleReconnect('detached_frame');
    } else if (msg.includes('already running')) {
      scheduleReconnect('already_running');
    } else {
      scheduleReconnect('initialize_error');
    }
  } finally {
    isInitializing = false;
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  const msg = String(err?.message || err || '').toLowerCase();
  if (msg.includes('detached frame') || msg.includes('execution context was destroyed') || msg.includes('target closed')) {
    if (!isIntentionalLogout) scheduleReconnect('unhandled_detached_frame');
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  const msg = String(err?.message || err || '').toLowerCase();
  if (msg.includes('detached frame') || msg.includes('execution context was destroyed') || msg.includes('target closed')) {
    if (!isIntentionalLogout) scheduleReconnect('uncaught_detached_frame');
    return;
  }
  process.exit(1);
});

initializeClient('startup');

// API Endpoints

// 1. Get Status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({ status: clientStatus });
});

// 2. Get QR Code
app.get('/api/whatsapp/qr', (req, res) => {
  if (clientStatus === 'QR_READY' && qrCodeDataUrl) {
    res.json({ qr: qrCodeDataUrl });
  } else {
    res.status(404).json({ error: 'QR not ready or already authenticated' });
  }
});

// 3. Send PDF endpoint
app.post('/api/whatsapp/send-pdf', upload.single('pdf'), async (req, res) => {
  if (clientStatus !== 'READY') {
    return res.status(503).json({ error: `WhatsApp is not ready (status: ${clientStatus})` });
  }

  const { phone, caption } = req.body;
  const file = req.file;

  if (!phone || !file) {
    return res.status(400).json({ error: 'Phone and PDF file are required' });
  }

  try {
    if (!client || clientStatus !== 'READY') {
      return res.status(503).json({ error: `WhatsApp client not ready (status: ${clientStatus})` });
    }

    // Format phone number to WhatsApp ID format (e.g., 905xxxxxxxxx@c.us)
    const chatId = `${phone.replace(/\D/g, '')}@c.us`;

    // Create MessageMedia from uploaded PDF file (real attachment)
    const media = MessageMedia.fromFilePath(file.path);
    media.filename = file.originalname || 'teklif.pdf';

    const sendWithAttachment = async () => {
      await client.sendMessage(chatId, media, {
        caption: caption || 'Merhaba, teklif dosyanız ekte yer almaktadır.',
        sendMediaAsDocument: true,
      });
    };

    // Send as document so WhatsApp shows PDF attachment card
    try {
      await sendWithAttachment();
    } catch (err) {
      if (!isDetachedFrameError(err)) throw err;
      console.warn('Detached frame detected during send. Re-initializing and retrying once...');
      await initializeClient('send_retry_detached_frame');
      // Give client a short window to become READY
      const started = Date.now();
      while (clientStatus !== 'READY' && Date.now() - started < 15000) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (clientStatus !== 'READY') {
        throw new Error(`Retry failed: WhatsApp not ready after reconnect (status: ${clientStatus})`);
      }
      await sendWithAttachment();
    }

    res.json({ success: true, message: 'PDF successfully sent' });
  } catch (error) {
    console.error('Send Error:', error);
    res.status(500).json({ error: 'Failed to send message: ' + error.message });
  } finally {
    // Clean up temp file
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
});

// Logout endpoint
app.post('/api/whatsapp/logout', async (req, res) => {
  try {
    isIntentionalLogout = true;
    clearReconnectTimer();
    
    if (client) {
      try { await client.logout(); } catch(e) {}
      try { await client.destroy(); } catch(e) {}
      client = null;
    }
    clientStatus = 'INITIALIZING';
    
    // Also delete the auth folder to be safe
    const authPath = path.join(__dirname, '.wwebjs_auth');
    if (fs.existsSync(authPath)) {
      try {
        fs.rmSync(authPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
      } catch (e) {
        console.error('Error removing auth folder (might be locked):', e);
      }
    }
    
    isIntentionalLogout = false;
    
    // Re-initialize to get a new QR code
    initializeClient('logout_reinit');
    
    res.json({ success: true });
  } catch (err) {
    isIntentionalLogout = false;
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed', details: err?.message || String(err) });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
