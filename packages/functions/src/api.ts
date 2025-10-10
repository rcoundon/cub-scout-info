import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getPublishedEvents } from './services/events';
import { getPublishedAnnouncements } from './services/announcements';
import authRoutes from './routes/auth';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://*.cubs-site.com'], // Update with your domain
    credentials: true,
  })
);

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

// Public API routes
app.get('/api/events', async (c) => {
  try {
    const events = await getPublishedEvents();
    return c.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

app.get('/api/announcements', async (c) => {
  try {
    const announcements = await getPublishedAnnouncements();
    return c.json({ announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return c.json({ error: 'Failed to fetch announcements' }, 500);
  }
});

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
