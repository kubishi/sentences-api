import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3001;

async function loadHandler(path) {
  try {
    const module = await import(join(__dirname, 'api', path));
    return module.default;
  } catch (e) {
    console.error(`Failed to load handler for ${path}:`, e);
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  // Parse URL
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Parse body for POST requests
  let body = '';
  if (req.method === 'POST') {
    for await (const chunk of req) {
      body += chunk;
    }
  }

  // Create mock request/response objects for Vercel handlers
  const mockReq = {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: body ? JSON.parse(body) : {},
    query: Object.fromEntries(url.searchParams)
  };

  const mockRes = {
    statusCode: 200,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
      res.setHeader(key, value);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      res.writeHead(this.statusCode, { 'Content-Type': 'application/json', ...this.headers });
      res.end(JSON.stringify(data));
    },
    send(data) {
      res.writeHead(this.statusCode, this.headers);
      res.end(data);
    },
    end() {
      res.writeHead(this.statusCode, this.headers);
      res.end();
    }
  };

  // Route requests
  let handler;
  if (pathname === '/healthz' || pathname === '/api/healthz') {
    handler = await loadHandler('healthz.js');
  } else if (pathname === '/builder/choices' || pathname === '/api/builder/choices') {
    handler = await loadHandler('builder/choices.js');
  } else if (pathname === '/builder/random' || pathname === '/api/builder/random') {
    handler = await loadHandler('builder/random.js');
  } else if (pathname === '/builder/translate' || pathname === '/api/builder/translate') {
    handler = await loadHandler('builder/translate.js');
  } else if (pathname === '/translator/translate' || pathname === '/api/translator/translate') {
    handler = await loadHandler('translator/translate.js');
  } else if (pathname === '/docs' || pathname === '/api/docs') {
    handler = await loadHandler('docs.js');
  } else if (pathname === '/openapi.json' || pathname === '/api/openapi.json') {
    handler = await loadHandler('openapi.json.js');
  }

  if (handler) {
    try {
      await handler(mockReq, mockRes);
    } catch (error) {
      console.error('Handler error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
});
