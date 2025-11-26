const express = require('express');
const net = require('net');
const dns = require('dns');
const { promisify } = require('util');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const resolveMx = promisify(dns.resolveMx);

const app = express();
const PORT = process.env.PORT || 8080;

// Security & Rate Limiting
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://fkbounce.com', 'https://app.fkbounce.com', 'https://www.fkbounce.com'],
  credentials: true
}));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later.'
});

app.use(limiter);

// API Key authentication (optional but recommended)
const API_KEY = process.env.API_KEY || 'your-secret-key-change-this';

function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === API_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized - Invalid API Key' });
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Test port 25 connectivity
app.get('/test-port25', async (req, res) => {
  const testResults = {
    port25Available: false,
    canConnectToGmail: false,
    error: null,
    details: []
  };

  try {
    testResults.details.push('✓ Socket module available');

    const connectionTest = await new Promise((resolve) => {
      const socket = net.createConnection(25, 'aspmx.l.google.com');
      let connected = false;

      socket.setTimeout(10000);

      socket.on('connect', () => {
        testResults.details.push('✓ Successfully connected to aspmx.l.google.com:25');
        connected = true;
        socket.end();
      });

      socket.on('data', (data) => {
        const response = data.toString();
        testResults.details.push(`✓ Received: ${response.trim().substring(0, 100)}`);
      });

      socket.on('timeout', () => {
        testResults.details.push('✗ Connection timeout (10s)');
        testResults.error = 'Timeout - port 25 may be blocked';
        socket.destroy();
        resolve(false);
      });

      socket.on('error', (err) => {
        testResults.details.push(`✗ Connection error: ${err.message}`);
        testResults.error = err.message;
        resolve(false);
      });

      socket.on('close', () => {
        if (connected) {
          testResults.details.push('✓ Connection closed gracefully');
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });

    testResults.canConnectToGmail = connectionTest;
    testResults.port25Available = connectionTest;

    if (testResults.port25Available) {
      testResults.details.push('✅ PORT 25 IS OPEN - SMTP verification will work!');
    } else {
      testResults.details.push('❌ PORT 25 IS BLOCKED - SMTP verification will not work');
    }

  } catch (error) {
    testResults.error = error.message;
    testResults.details.push(`✗ Unexpected error: ${error.message}`);
  }

  res.json(testResults);
});

// SMTP Check endpoint
app.post('/check-smtp', authenticateAPIKey, async (req, res) => {
  const { email, mxRecords } = req.body;

  if (!email || !mxRecords || !Array.isArray(mxRecords) || mxRecords.length === 0) {
    return res.status(400).json({ error: 'Invalid request. Provide email and mxRecords array.' });
  }

  try {
    const result = await checkSMTP(email, mxRecords);
    res.json({ email, smtp: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all Check endpoint
app.post('/check-catchall', authenticateAPIKey, async (req, res) => {
  const { domain, mxRecords } = req.body;

  if (!domain || !mxRecords || !Array.isArray(mxRecords) || mxRecords.length === 0) {
    return res.status(400).json({ error: 'Invalid request. Provide domain and mxRecords array.' });
  }

  try {
    const result = await checkCatchAll(domain, mxRecords);
    res.json({ domain, catchAll: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Combined verification endpoint
app.post('/verify', authenticateAPIKey, async (req, res) => {
  const { email, domain, mxRecords } = req.body;

  if (!email || !domain || !mxRecords || !Array.isArray(mxRecords) || mxRecords.length === 0) {
    return res.status(400).json({ error: 'Invalid request. Provide email, domain, and mxRecords array.' });
  }

  try {
    const [smtp, catchAll] = await Promise.all([
      checkSMTP(email, mxRecords),
      checkCatchAll(domain, mxRecords)
    ]);

    res.json({ email, domain, smtp, catchAll });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SMTP Check Function
async function checkSMTP(email, mxRecords, attempt = 0) {
  if (!mxRecords || mxRecords.length === 0) {
    return false;
  }

  const mxHost = typeof mxRecords[0] === 'string' ? mxRecords[0] : mxRecords[0].exchange;

  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxHost);
    let responses = [];
    let accepted = false;

    socket.setTimeout(10000);

    socket.on('connect', () => {
      socket.write(`HELO verifier.com\r\n`);
    });

    socket.on('data', (data) => {
      const response = data.toString();
      responses.push(response);

      if (response.includes('220') && !responses.some(r => r.includes('MAIL FROM'))) {
        socket.write(`MAIL FROM:<test@verifier.com>\r\n`);
      } else if (response.includes('250') && responses.filter(r => r.includes('250')).length === 1) {
        socket.write(`RCPT TO:<${email}>\r\n`);
      } else if (response.includes('250') && responses.filter(r => r.includes('250')).length >= 2) {
        accepted = true;
        socket.write(`QUIT\r\n`);
        socket.end();
      } else if (response.includes('550') || response.includes('551') || response.includes('553')) {
        accepted = false;
        socket.write(`QUIT\r\n`);
        socket.end();
      }
    });

    socket.on('timeout', async () => {
      socket.destroy();
      if (attempt < 2) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
        resolve(await checkSMTP(email, mxRecords, attempt + 1));
      } else {
        resolve(false);
      }
    });

    socket.on('error', async () => {
      if (attempt < 2) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
        resolve(await checkSMTP(email, mxRecords, attempt + 1));
      } else {
        resolve(false);
      }
    });

    socket.on('close', () => {
      resolve(accepted);
    });
  });
}

// Catch-all Check Function
async function checkCatchAll(domain, mxRecords) {
  if (!mxRecords || mxRecords.length === 0) {
    return false;
  }

  const mxHost = typeof mxRecords[0] === 'string' ? mxRecords[0] : mxRecords[0].exchange;
  const randomEmail = `random${Date.now()}${Math.random().toString(36).substring(7)}@${domain}`;

  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxHost);
    let responses = [];
    let catchAllDetected = false;

    socket.setTimeout(10000);

    socket.on('connect', () => {
      socket.write(`HELO verifier.com\r\n`);
    });

    socket.on('data', (data) => {
      const response = data.toString();
      responses.push(response);

      if (response.includes('220') && !responses.some(r => r.includes('MAIL FROM'))) {
        socket.write(`MAIL FROM:<test@verifier.com>\r\n`);
      } else if (response.includes('250') && responses.filter(r => r.includes('250')).length === 1) {
        socket.write(`RCPT TO:<${randomEmail}>\r\n`);
      } else if (response.includes('250') && responses.filter(r => r.includes('250')).length >= 2) {
        catchAllDetected = true;
        socket.write(`QUIT\r\n`);
        socket.end();
      } else if (response.includes('550') || response.includes('551') || response.includes('553')) {
        catchAllDetected = false;
        socket.write(`QUIT\r\n`);
        socket.end();
      }
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(catchAllDetected);
    });

    socket.on('error', () => {
      resolve(catchAllDetected);
    });

    socket.on('close', () => {
      resolve(catchAllDetected);
    });
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SMTP Microservice running on port ${PORT}`);
  console.log(`📧 Ready to handle SMTP verifications`);
  console.log(`🔒 API Key authentication: ${API_KEY !== 'your-secret-key-change-this' ? 'ENABLED' : 'DISABLED (SET API_KEY ENV VAR!)'}`);
});
