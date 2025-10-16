import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { logger } from 'hono/logger';
import authRoutes from './routes/auth';
import eventsRoutes from './routes/events';
import announcementsRoutes from './routes/announcements';
import attachmentsRoutes from './routes/attachments';
import adminUsersRoutes from './routes/admin-users';
import contactRoutes from './routes/contact';
import externalLinksRoutes from './routes/external-links';

const app = new Hono();

// Middleware
app.use('*', logger());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test JSON parsing
app.post('/test-json', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({ received: body });
  } catch (error) {
    return c.json({ error: 'Failed to parse JSON', message: String(error) }, 400);
  }
});

// Debug headers endpoint
app.get('/debug/headers', (c) => {
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return c.json({ headers, authHeader: c.req.header('Authorization') });
});

// Authentication routes
app.route('/api/auth', authRoutes);

// Events routes
app.route('/api/events', eventsRoutes);

// Announcements routes
app.route('/api/announcements', announcementsRoutes);

// Attachments routes
app.route('/api', attachmentsRoutes);

// Admin user management routes
app.route('/api/admin/users', adminUsersRoutes);

// Contact routes
app.route('/api/contact', contactRoutes);

// External links routes
app.route('/api/external-links', externalLinksRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export const handler = handle(app);
