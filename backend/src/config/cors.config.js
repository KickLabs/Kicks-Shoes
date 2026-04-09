import cors from 'cors';

// Allow-list and flexible origin matcher
const allowedOrigins = [
  // Development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',

  // Production (Frontend)
  'https://kicks-shoes-2025.web.app',
  'https://kicks-shoes-2025.firebaseapp.com',

  // AWS S3 + CloudFront
  'http://kicks-shoes-frontend.s3-website-ap-southeast-1.amazonaws.com',
  'https://kicks-shoes-frontend.s3-website-ap-southeast-1.amazonaws.com',
];

const originPatterns = [
  /^https:\/\/kicks-shoes-2025\.web\.app$/,
  /^https:\/\/kicks-shoes-2025\.firebaseapp\.com$/,
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without origin (mobile apps, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || originPatterns.some(re => re.test(origin))) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
};

export const corsMiddleware = cors(corsOptions);
