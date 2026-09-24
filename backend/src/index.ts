import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

import { initializeDatabase } from './db/mysql.js';
import { leadsRouter } from './routes/leads.js';
import { invoicesRouter } from './routes/invoices.js';
import { admissionsRouter } from './routes/admissions.js';
import { paymentsRouter } from './routes/payments.js';
import { classSessionsRouter } from './routes/class-sessions.js';
import { interventionsRouter } from './routes/interventions.js';
import { aiRouter } from './routes/ai.js';
import { studentsRouter } from './routes/students.js';
import { batchesRouter } from './routes/batches.js';
import { materialsRouter } from './routes/materials.js';
import { messagesRouter } from './routes/messages.js';
import { testResultsRouter } from './routes/test-results.js';
import { reportsRouter } from './routes/reports.js';
import { authRouter } from './routes/auth.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middlewares
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
  })
);

app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next) => {
  console.log(`[BACKEND] ${req.method} ${req.url}`);
  next();
});

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'CoachingOS Backend REST API',
    database: 'MySQL 8.4 (coachingos_db)',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'CoachingOS Backend REST API',
    version: '1.0.0',
    database: 'MySQL 8.4 (coachingos_db)',
    timestamp: new Date().toISOString(),
  });
});

// Mount API v1 Routes
app.use('/api/v1/leads', leadsRouter);
app.use('/api/v1/invoices', invoicesRouter);
app.use('/api/v1/admissions', admissionsRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/class-sessions', classSessionsRouter);
app.use('/api/v1/interventions', interventionsRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/students', studentsRouter);
app.use('/api/v1/batches', batchesRouter);
app.use('/api/v1/materials', materialsRouter);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/test-results', testResultsRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/auth', authRouter);


// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    data: null,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
});

// Start Server after Database Initialization
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🚀 CoachingOS Backend API running on http://localhost:${PORT}`);
      console.log(`   Database: MySQL 8.4 connected to coachingos_db`);
      console.log(`   CORS Allowed Origin: ${CORS_ORIGIN}`);
      console.log(`   Health Check: http://localhost:${PORT}/health`);
      console.log(`====================================================`);
    });
  } catch (err: any) {
    console.error(`[FATAL] Failed to initialize database:`, err);
    process.exit(1);
  }
}

startServer();

export default app;
