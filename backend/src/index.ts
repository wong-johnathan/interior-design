import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from './lib/logger';

// ─── Route Imports ────────────────────────────────────────────────
import btoRoutes from './routes/bto';
import projectRoutes from './routes/projects';
import modelRoutes from './routes/models';
import aiRoutes from './routes/ai';
import renderRoutes from './routes/render';
import uploadRoutes from './routes/upload';
import exportRoutes from './routes/export';
import furnitureRoutes from './routes/furniture';
import wallRoutes from './routes/walls';
import presetRoutes from './routes/presets';
import floorPlanRoutes from './routes/floorPlan';

// ─── App Initialization ──────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// ─── Middleware ───────────────────────────────────────────────────

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProduction ? undefined : false,
}));

// CORS — allow the Next.js frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  const start = Date.now();
  const originalEnd = _res.end.bind(_res);

  // Override end to log request duration
  _res.end = function (this: Response, ...args: [any, BufferEncoding, (() => void)?]) {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${_res.statusCode} ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: _res.statusCode,
      duration,
    });
    return originalEnd(...args);
  } as typeof _res.end;

  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────

app.use('/api/bto', btoRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/render', renderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/import', exportRoutes); // Reuse export router for /api/import
app.use('/api/furniture', furnitureRoutes);
app.use('/api/walls', wallRoutes);
app.use('/api/presets', presetRoutes);
app.use('/api/floor-plans', floorPlanRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Error Handler ────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  res.status(500).json({
    error: isProduction ? 'Internal server error' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// ─── Server Start ─────────────────────────────────────────────────

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: isProduction ? 'production' : 'development',
    port: PORT,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  });
});

export default app;
