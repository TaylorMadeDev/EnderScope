import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { config } from './config.js';
import { logger } from './lib/log-store.js';
import { initializeDatabase } from './lib/database.js';
import apiRouter from './routes/api.js';
import authRouter from './routes/auth.js';

const app = express();

app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use('/api', apiRouter);
app.use('/auth', authRouter);

if (fs.existsSync(config.paths.frontendDist)) {
  app.use(express.static(config.paths.frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      return next();
    }
    return res.sendFile(path.join(config.paths.frontendDist, 'index.html'));
  });
}

async function startServer() {
  try {
    await initializeDatabase();

    const server = app.listen(config.port, () => {
      const message = `EnderScope backend listening on http://localhost:${config.port}`;
      console.log(message);
      logger.info('Node backend started', { port: config.port });
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.port} is already in use. Stop the other backend instance or change PORT in backend/.env.`);
        return;
      }

      console.error('Backend failed to start:', error);
    });
  } catch (error) {
    console.error('Backend failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();
