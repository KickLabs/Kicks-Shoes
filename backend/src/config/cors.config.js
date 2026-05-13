import cors from 'cors';

const normalizeOrigin = value => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/$/, '');
  }
};

const parseOriginList = value => {
  if (!value) return [];
  return value
    .split(',')
    .map(item => normalizeOrigin(item))
    .filter(Boolean);
};

// Allow-list and flexible origin matcher
const baseAllowedOrigins = [
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
  'https://d1n7m1eramrdgj.cloudfront.net',
];

const envAllowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLOUDFRONT_URL,
  process.env.CLOUDFRONT_DOMAIN,
  process.env.AWS_FRONTEND_URL,
  process.env.APP_URL,
];

const allowedOrigins = [
  ...baseAllowedOrigins,
  ...envAllowedOrigins,
  ...parseOriginList(process.env.CORS_ALLOWED_ORIGINS),
]
  .map(origin => normalizeOrigin(origin))
  .filter(Boolean)
  .filter((origin, index, arr) => arr.indexOf(origin) === index);

const cloudFrontDomain =
  process.env.CLOUDFRONT_DOMAIN && !process.env.CLOUDFRONT_DOMAIN.includes('://')
    ? process.env.CLOUDFRONT_DOMAIN.replace(/\./g, '\\.')
    : null;

const originPatterns = [
  /^https:\/\/kicks-shoes-2025\.web\.app$/,
  /^https:\/\/kicks-shoes-2025\.firebaseapp\.com$/,
  ...(cloudFrontDomain ? [new RegExp(`^https://${cloudFrontDomain}$`)] : []),
  ...(process.env.ALLOW_ANY_CLOUDFRONT === 'true'
    ? [/^https:\/\/[a-z0-9-]+\.cloudfront\.net$/]
    : []),
];

export const isOriginAllowed = origin => {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  return allowedOrigins.includes(normalized) || originPatterns.some(re => re.test(normalized));
};

export const getAllowedOrigins = () => [...allowedOrigins];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without origin (mobile apps, curl)
    if (!origin) return callback(null, true);

    if (isOriginAllowed(origin)) {
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
