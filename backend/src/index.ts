import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import eventsRoutes from './routes/events';
import calendarsRoutes from './routes/calendars';
import tasksRoutes from './routes/tasks';
import appointmentsRoutes from './routes/appointments';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// ──────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));

// ──────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/calendars', calendarsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/appointments', appointmentsRoutes);

// ──────────────────────────────────────────────
// 404 handler for unmatched routes
// ──────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

// ──────────────────────────────────────────────
// Global error handler (must be last)
// ──────────────────────────────────────────────

app.use(errorHandler);

// ──────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Google Calendar Clone API server running on http://localhost:${PORT}`);
  console.log(`   CORS origin: ${CORS_ORIGIN}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
