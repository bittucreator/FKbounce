const express = require('express');
const net = require('net');
const dns = require('dns');
const { promisify } = require('util');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;
const resolveMx = promisify(dns.resolveMx);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://fkbounce.com', 'https://app.fkbounce.com', 'https://www.fkbounce.com'],
  methods: ['POST', 'GET']
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'smtp-verification',
    port25Available: true,
    timestamp: new Date().toISOString()
  });
});

// SMTP verification function
async function checkSMTP(email, mxRecords, attempt = 0) {
  if (!mxRecords || mxRecords.length === 0) {
    return false;
  }

  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxRecords[0].exchange);
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
      } 
      else if (response.includes('250') && responses.filter(r => r.includes('250')).length === 1) {
        socket.write(`RCPT TO:<${email}>\r\n`);
      } 
      else if (response.includes('250') && responses.filter(r => r.includes('250')).length >= 2) {
        accepted = true;
        socket.write(`QUIT\r\n`);
        socket.end();
      } 
      else if (response.includes('550') || response.includes('551') || response.includes('553')) {
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

// Catch-all detection function
async function checkCatchAll(domain, mxRecords) {
  if (!mxRecords || mxRecords.length === 0) {
    return false;
  }

  const randomEmail = `random${Date.now()}${Math.random().toString(36).substring(7)}@${domain}`;
  
  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxRecords[0].exchange);
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

// Single email SMTP check endpoint
app.post('/api/check-smtp', async (req, res) => {
  try {
    const { email, domain } = req.body;

    if (!email || !domain) {
      return res.status(400).json({ error: 'Email and domain are required' });
    }

    // Get MX records
    const mxRecords = await resolveMx(domain);
    
    if (!mxRecords || mxRecords.length === 0) {
      return res.json({ smtp: false, error: 'No MX records found' });
    }

    // Check SMTP
    const smtpValid = await checkSMTP(email, mxRecords);

    res.json({ 
      smtp: smtpValid,
      mxRecords: mxRecords.map(r => r.exchange)
    });
  } catch (error) {
    console.error('SMTP check error:', error);
    res.status(500).json({ 
      error: 'SMTP check failed',
      smtp: false 
    });
  }
});

// Catch-all detection endpoint
app.post('/api/check-catchall', async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    // Get MX records
    const mxRecords = await resolveMx(domain);
    
    if (!mxRecords || mxRecords.length === 0) {
      return res.json({ catchAll: false, error: 'No MX records found' });
    }

    // Check catch-all
    const isCatchAll = await checkCatchAll(domain, mxRecords);

    res.json({ 
      catchAll: isCatchAll,
      mxRecords: mxRecords.map(r => r.exchange)
    });
  } catch (error) {
    console.error('Catch-all check error:', error);
    res.status(500).json({ 
      error: 'Catch-all check failed',
      catchAll: false 
    });
  }
});

// Combined verification endpoint
app.post('/api/verify', async (req, res) => {
  try {
    const { email, checkCatchAll: shouldCheckCatchAll = true } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const domain = email.split('@')[1];
    if (!domain) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get MX records
    const mxRecords = await resolveMx(domain);
    
    if (!mxRecords || mxRecords.length === 0) {
      return res.json({ 
        smtp: false, 
        catchAll: false,
        error: 'No MX records found' 
      });
    }

    // Run SMTP and catch-all checks in parallel
    const [smtpValid, isCatchAll] = await Promise.all([
      checkSMTP(email, mxRecords),
      shouldCheckCatchAll ? checkCatchAll(domain, mxRecords) : Promise.resolve(false)
    ]);

    res.json({ 
      smtp: smtpValid,
      catchAll: isCatchAll,
      mxRecords: mxRecords.map(r => r.exchange)
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      error: 'Verification failed',
      smtp: false,
      catchAll: false
    });
  }
});

// Bulk verification endpoint
app.post('/api/verify-bulk', async (req, res) => {
  try {
    const { emails, checkCatchAll: shouldCheckCatchAll = true } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Emails array is required' });
    }

    if (emails.length > 1000) {
      return res.status(400).json({ error: 'Maximum 1000 emails per request' });
    }

    const results = [];

    // Process in batches of 10
    for (let i = 0; i < emails.length; i += 10) {
      const batch = emails.slice(i, i + 10);
      
      const batchResults = await Promise.all(
        batch.map(async (email) => {
          try {
            const domain = email.split('@')[1];
            const mxRecords = await resolveMx(domain);
            
            if (!mxRecords || mxRecords.length === 0) {
              return { email, smtp: false, catchAll: false };
            }

            const [smtp, catchAll] = await Promise.all([
              checkSMTP(email, mxRecords),
              shouldCheckCatchAll ? checkCatchAll(domain, mxRecords) : Promise.resolve(false)
            ]);

            return { email, smtp, catchAll };
          } catch (error) {
            return { email, smtp: false, catchAll: false, error: error.message };
          }
        })
      );

      results.push(...batchResults);
    }

    res.json({ results });
  } catch (error) {
    console.error('Bulk verification error:', error);
    res.status(500).json({ error: 'Bulk verification failed' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SMTP Verification Service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Allowed origins: ${process.env.ALLOWED_ORIGINS}`);
});
