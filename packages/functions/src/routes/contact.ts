import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createContactMessage,
  getContactMessage,
  getAllContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
} from '../services/contact';
import { sendContactFormNotification, sendContactConfirmation } from '../services/email';
import { checkRateLimit, getIpAddress } from '../services/rate-limit';
import { requireAuth, requireEditor } from '../middleware/auth';

const app = new Hono();

// Validation schema
const contactMessageSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  website: z.string().optional(), // Honeypot field - should be empty
});

/**
 * POST /api/contact - Submit contact form (public)
 */
app.post('/', zValidator('json', contactMessageSchema), async (c) => {
  try {
    const messageData = c.req.valid('json');

    // Honeypot check - if website field is filled, it's a bot
    if (messageData.website && messageData.website.trim().length > 0) {
      console.log('Contact form spam detected: honeypot field filled');
      // Return success to not tip off the bot
      return c.json(
        {
          success: true,
          message: 'Thank you for your message. We will get back to you soon!',
        },
        201
      );
    }

    // Rate limiting check
    const ipAddress = getIpAddress(c.req.header());
    const rateLimit = await checkRateLimit(ipAddress, 'contact-form');

    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for IP: ${ipAddress}`);
      return c.json(
        {
          error: 'Too many requests',
          message: 'You have submitted too many messages. Please try again later.',
          resetTime: rateLimit.resetTime,
        },
        429
      );
    }

    // Save to database (exclude honeypot field)
    const { website, ...cleanData } = messageData;
    const contactMessage = await createContactMessage(cleanData);

    // Send email notifications (admin + confirmation to sender)
    // Run both in parallel and handle errors gracefully
    const emailPromises = [
      // Admin notification
      sendContactFormNotification({
        fromName: messageData.name,
        fromEmail: messageData.email,
        subject: messageData.subject,
        message: messageData.message,
        messageId: contactMessage.id,
      }).catch(error => {
        console.error('Failed to send admin notification:', error);
      }),

      // Auto-reply confirmation to sender
      sendContactConfirmation({
        toEmail: messageData.email,
        toName: messageData.name,
        subject: messageData.subject,
      }).catch(error => {
        console.error('Failed to send confirmation to sender:', error);
      }),
    ];

    // Wait for both emails (non-blocking for the response)
    await Promise.allSettled(emailPromises);
    // The message is still saved in the database, so the admin can see it there

    return c.json(
      {
        success: true,
        message: 'Thank you for your message. We will get back to you soon!',
        id: contactMessage.id,
      },
      201
    );
  } catch (error) {
    console.error('Error creating contact message:', error);
    return c.json(
      {
        error: 'Failed to send message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/contact/admin/all - Get all contact messages (requires authentication)
 */
app.get('/admin/all', requireAuth, async (c) => {
  try {
    const messages = await getAllContactMessages();
    return c.json({ messages });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

/**
 * GET /api/contact/admin/:id - Get single contact message (requires authentication)
 */
app.get('/admin/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id');
    const message = await getContactMessage(id);

    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    return c.json({ message });
  } catch (error) {
    console.error('Error fetching contact message:', error);
    return c.json({ error: 'Failed to fetch message' }, 500);
  }
});

/**
 * PATCH /api/contact/admin/:id/status - Update message status (requires editor role)
 */
app.patch(
  '/admin/:id/status',
  requireEditor,
  zValidator('json', z.object({ status: z.enum(['new', 'read', 'replied', 'archived']) })),
  async (c) => {
    try {
      const id = c.req.param('id');
      const { status } = c.req.valid('json');

      const message = await updateContactMessageStatus(id, status);

      if (!message) {
        return c.json({ error: 'Message not found' }, 404);
      }

      return c.json({
        success: true,
        message,
      });
    } catch (error) {
      console.error('Error updating contact message:', error);
      return c.json(
        {
          error: 'Failed to update message',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * DELETE /api/contact/admin/:id - Delete contact message (requires editor role)
 */
app.delete('/admin/:id', requireEditor, async (c) => {
  try {
    const id = c.req.param('id');

    const existing = await getContactMessage(id);
    if (!existing) {
      return c.json({ error: 'Message not found' }, 404);
    }

    await deleteContactMessage(id);

    return c.json({
      success: true,
      message: 'Contact message deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    return c.json(
      {
        error: 'Failed to delete message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default app;
