import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(backendRoot, '..');

export const config = {
  port: Number(process.env.PORT || 8000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'serverbuster-dev-secret',
  db: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'serverbuster',
    user: process.env.DB_USER || 'root',
    pass: process.env.DB_PASS || '',
    ssl: process.env.DB_SSL || '',
    ca: process.env.DB_CA || '',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      `http://localhost:${process.env.PORT || 8000}/auth/google-callback`,
  },
  paths: {
    backendRoot,
    projectRoot,
    configFile: path.join(backendRoot, 'data', 'config', 'config.json'),
    logFile: path.join(backendRoot, 'data', 'logs', 'serverbuster.log'),
    frontendDist: path.join(projectRoot, 'frontend', 'dist'),
  },
};
