require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

const allowedOrigins = [
  'https://dsa-blond-six.vercel.app',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
]
  .filter(Boolean)
  .flatMap(value => value.split(','))
  .map(value => value.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) return true;

  // Support fresh Vercel preview/production deploy URLs without editing the server each time.
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;

  // Keep local development working.
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;

  return false;
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked for origin: ${origin}`);
    return callback(null, false);
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  optionsSuccessStatus: 204
};

// DEBUGGING: Log every incoming request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Set CORS headers early so browser preflight checks succeed consistently on Render.
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.header('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Handle CORS for actual route requests too.
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// USE ABSOLUTE PATHS FOR ROUTES (Fixes 404s on Render)
// __dirname is the directory of the current file (server/)
const authRoutes = require(path.resolve(__dirname, 'routes/auth'));
const probRoutes = require(path.resolve(__dirname, 'routes/problems'));
const userBaseRoutes = require(path.resolve(__dirname, 'routes/users'));
const platformRoutes = require(path.resolve(__dirname, 'routes/platforms'));
const leetcodeRoutes = require(path.resolve(__dirname, 'routes/leetcode'));

app.use('/api/auth', authRoutes);
app.use('/api/problems', probRoutes);
app.use('/api/users', userBaseRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/leetcode', leetcodeRoutes);

// Fix Static Uploads
app.use('/uploads', express.static(path.resolve(__dirname, 'public/uploads')));

app.get('/api/test', (req, res) => res.json({ status: "ok" }));
app.get('/', (req, res) => res.send("API IS RUNNING"));

// MONGODB
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Atlas Connected'))
    .catch(err => console.error('DB ERROR:', err));
} else {
  console.error('CRITICAL: MONGO_URI is missing');
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
