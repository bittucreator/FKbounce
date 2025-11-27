const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const net = require('net');
const dns = require('dns');
const { promisify } = require('util');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_SECRET = process.env.API_SECRET || 'your-secret-key-here';

// Promisify DNS
const resolveMx = promisify(dns.resolveMx);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://fkbounce.com', 'http://localhost:3000'],
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later' }
});
app.use(limiter);

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_SECRET) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// SMTP Provider Detection
const SMTP_PROVIDERS = {
  'Google Workspace': ['google.com', 'googlemail.com', 'aspmx.l.google.com'],
  'Microsoft 365': ['outlook.com', 'protection.outlook.com'],
  'Gmail': ['gmail.com'],
  'Yahoo': ['yahoo.com', 'yahoodns.net'],
  'Zoho': ['zoho.com', 'zohomail.com'],
  'Proofpoint': ['pphosted.com', 'proofpoint.com'],
  'Mimecast': ['mimecast.com'],
  'Amazon SES': ['amazonses.com', 'amazonaws.com'],
  'SendGrid': ['sendgrid.net'],
  'iCloud': ['icloud.com', 'me.com', 'apple.com'],
  'ProtonMail': ['protonmail.ch', 'protonmail.com']
};

function detectProvider(mxRecords) {
  if (!mxRecords || mxRecords.length === 0) return null;
  
  for (const mx of mxRecords) {
    const exchange = mx.exchange.toLowerCase();
    for (const [provider, patterns] of Object.entries(SMTP_PROVIDERS)) {
      if (patterns.some(p => exchange.includes(p))) {
        return provider;
      }
    }
  }
  return null;
}

// SMTP Check with MX Fallback
async function checkSMTP(email, mxRecords, mxIndex = 0) {
  if (!mxRecords || mxRecords.length === 0) {
    return { accepted: false, connected: false, error: 'No MX records' };
  }

  const sortedMx = [...mxRecords].sort((a, b) => a.priority - b.priority);
  const currentMx = sortedMx[mxIndex];
  
  if (!currentMx) {
    return { accepted: false, connected: false, error: 'No more MX servers' };
  }

  return new Promise((resolve) => {
    const socket = net.createConnection(25, currentMx.exchange);
    let responses = [];
    let accepted = false;
    let connected = false;
    let responseBuffer = '';

    socket.setTimeout(15000); // 15 seconds timeout

    socket.on('connect', () => {
      connected = true;
    });

    socket.on('data', (data) => {
      responseBuffer += data.toString();
      const lines = responseBuffer.split('\r\n');
      
      for (const line of lines) {
        if (!line) continue;
        
        // Server greeting
        if (line.startsWith('220') && !responses.includes('HELO')) {
          responses.push('HELO');
          socket.write(`EHLO verifier.fkbounce.com\r\n`);
        }
        // EHLO accepted or HELO fallback
        else if (line.startsWith('250') && responses.includes('HELO') && !responses.includes('MAIL')) {
          responses.push('MAIL');
          socket.write(`MAIL FROM:<verify@fkbounce.com>\r\n`);
        }
        // MAIL FROM accepted
        else if (line.startsWith('250') && responses.includes('MAIL') && !responses.includes('RCPT')) {
          responses.push('RCPT');
          socket.write(`RCPT TO:<${email}>\r\n`);
        }
        // RCPT TO accepted - email exists
        else if (line.startsWith('250') && responses.includes('RCPT')) {
          accepted = true;
          socket.write(`QUIT\r\n`);
          socket.end();
        }
        // RCPT TO rejected - email doesn't exist
        else if (line.startsWith('550') || line.startsWith('551') || line.startsWith('552') || line.startsWith('553') || line.startsWith('554')) {
          accepted = false;
          socket.write(`QUIT\r\n`);
          socket.end();
        }
        // Greylisting - temporary error
        else if (line.startsWith('450') || line.startsWith('451') || line.startsWith('452')) {
          // Could implement retry logic here
          accepted = false;
          socket.write(`QUIT\r\n`);
          socket.end();
        }
      }
    });

    socket.on('timeout', async () => {
      socket.destroy();
      // Try next MX server
      if (mxIndex + 1 < sortedMx.length) {
        resolve(await checkSMTP(email, mxRecords, mxIndex + 1));
      } else {
        resolve({ accepted: false, connected, error: 'Timeout on all MX servers' });
      }
    });

    socket.on('error', async (err) => {
      socket.destroy();
      // Try next MX server
      if (mxIndex + 1 < sortedMx.length) {
        resolve(await checkSMTP(email, mxRecords, mxIndex + 1));
      } else {
        resolve({ accepted: false, connected, error: err.message });
      }
    });

    socket.on('close', () => {
      resolve({ accepted, connected, error: null });
    });
  });
}

// Catch-All Check with MX Fallback
async function checkCatchAll(domain, mxRecords, mxIndex = 0) {
  if (!mxRecords || mxRecords.length === 0) {
    return { isCatchAll: false, connected: false };
  }

  const sortedMx = [...mxRecords].sort((a, b) => a.priority - b.priority);
  const currentMx = sortedMx[mxIndex];
  
  if (!currentMx) {
    return { isCatchAll: false, connected: false };
  }

  const randomEmail = `nonexistent${Date.now()}${Math.random().toString(36).substring(7)}@${domain}`;

  return new Promise((resolve) => {
    const socket = net.createConnection(25, currentMx.exchange);
    let responses = [];
    let isCatchAll = false;
    let connected = false;

    socket.setTimeout(15000);

    socket.on('connect', () => {
      connected = true;
    });

    socket.on('data', (data) => {
      const response = data.toString();
      
      if (response.includes('220') && !responses.includes('HELO')) {
        responses.push('HELO');
        socket.write(`EHLO verifier.fkbounce.com\r\n`);
      }
      else if (response.includes('250') && responses.includes('HELO') && !responses.includes('MAIL')) {
        responses.push('MAIL');
        socket.write(`MAIL FROM:<verify@fkbounce.com>\r\n`);
      }
      else if (response.includes('250') && responses.includes('MAIL') && !responses.includes('RCPT')) {
        responses.push('RCPT');
        socket.write(`RCPT TO:<${randomEmail}>\r\n`);
      }
      else if (response.includes('250') && responses.includes('RCPT')) {
        isCatchAll = true;
        socket.write(`QUIT\r\n`);
        socket.end();
      }
      else if (response.includes('550') || response.includes('551') || response.includes('553')) {
        isCatchAll = false;
        socket.write(`QUIT\r\n`);
        socket.end();
      }
    });

    socket.on('timeout', async () => {
      socket.destroy();
      if (mxIndex + 1 < sortedMx.length) {
        resolve(await checkCatchAll(domain, mxRecords, mxIndex + 1));
      } else {
        resolve({ isCatchAll: false, connected });
      }
    });

    socket.on('error', async () => {
      socket.destroy();
      if (mxIndex + 1 < sortedMx.length) {
        resolve(await checkCatchAll(domain, mxRecords, mxIndex + 1));
      } else {
        resolve({ isCatchAll: false, connected });
      }
    });

    socket.on('close', () => {
      resolve({ isCatchAll, connected });
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Port 25 test endpoint
app.get('/test-port25', async (req, res) => {
  try {
    const testResult = await new Promise((resolve) => {
      const socket = net.createConnection(25, 'aspmx.l.google.com');
      let connected = false;

      socket.setTimeout(10000);

      socket.on('connect', () => {
        connected = true;
        socket.end();
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ success: false, error: 'Timeout' });
      });

      socket.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });

      socket.on('close', () => {
        resolve({ success: connected, error: null });
      });
    });

    res.json({
      port25Available: testResult.success,
      message: testResult.success 
        ? '✅ Port 25 is open - SMTP verification will work!' 
        : '❌ Port 25 is blocked',
      error: testResult.error
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Main SMTP verification endpoint
app.post('/verify', validateApiKey, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.json({
      email,
      smtp: false,
      catch_all: false,
      smtp_provider: null,
      connected: false,
      error: 'Invalid email syntax'
    });
  }

  const domain = email.split('@')[1];

  try {
    // Get MX records
    let mxRecords;
    try {
      mxRecords = await resolveMx(domain);
    } catch (dnsError) {
      return res.json({
        email,
        smtp: false,
        catch_all: false,
        smtp_provider: null,
        connected: false,
        error: 'No MX records found'
      });
    }

    // Detect provider
    const smtpProvider = detectProvider(mxRecords);

    // Check SMTP
    const smtpResult = await checkSMTP(email, mxRecords);

    // Check Catch-All
    const catchAllResult = await checkCatchAll(domain, mxRecords);

    res.json({
      email,
      smtp: smtpResult.accepted,
      catch_all: catchAllResult.isCatchAll,
      smtp_provider: smtpProvider,
      connected: smtpResult.connected,
      mx_servers: mxRecords.length,
      error: smtpResult.error
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      email,
      smtp: false,
      catch_all: false,
      smtp_provider: null,
      connected: false,
      error: error.message
    });
  }
});

// Bulk verification endpoint
app.post('/verify-bulk', validateApiKey, async (req, res) => {
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ error: 'Emails array is required' });
  }

  if (emails.length > 100) {
    return res.status(400).json({ error: 'Maximum 100 emails per request' });
  }

  const results = [];
  
  // Process in parallel with concurrency limit
  const concurrency = 10;
  for (let i = 0; i < emails.length; i += concurrency) {
    const batch = emails.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (email) => {
        try {
          const domain = email.split('@')[1];
          const mxRecords = await resolveMx(domain).catch(() => null);
          
          if (!mxRecords) {
            return { email, smtp: false, catch_all: false, error: 'No MX records' };
          }

          const smtpResult = await checkSMTP(email, mxRecords);
          const catchAllResult = await checkCatchAll(domain, mxRecords);
          const smtpProvider = detectProvider(mxRecords);

          return {
            email,
            smtp: smtpResult.accepted,
            catch_all: catchAllResult.isCatchAll,
            smtp_provider: smtpProvider,
            connected: smtpResult.connected
          };
        } catch (error) {
          return { email, smtp: false, catch_all: false, error: error.message };
        }
      })
    );
    results.push(...batchResults);
  }

  res.json({ results, total: results.length });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SMTP Microservice running on port ${PORT}`);
  console.log(`📧 Ready to verify emails via SMTP`);
});
