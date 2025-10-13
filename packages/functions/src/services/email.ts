import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

/**
 * Email Service using AWS SES
 * Handles sending transactional emails (invitations, notifications, etc.)
 */

const client = new SESClient({});

// TODO: Configure these in SST or environment variables
const FROM_EMAIL = process.env.FROM_EMAIL || 'rosscoundonaws@gmail.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hello@1stholmergreenscouts.org.uk';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const ORGANIZATION_NAME = process.env.ORGANIZATION_NAME || '1st Holmer Green Scout Group';

export interface SendInvitationEmailParams {
  toEmail: string;
  toName: string;
  invitedBy: string;
  token: string;
  role: string;
}

/**
 * Send an invitation email to a new user
 */
export async function sendInvitationEmail(params: SendInvitationEmailParams) {
  const { toEmail, toName, invitedBy, token, role } = params;

  const invitationUrl = `${SITE_URL}/accept-invite?token=${token}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${ORGANIZATION_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ${ORGANIZATION_NAME}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                You've Been Invited!
              </h2>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Hello ${toName},
              </p>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                ${invitedBy} has invited you to join ${ORGANIZATION_NAME} as a <strong>${role}</strong>.
              </p>

              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Click the button below to accept your invitation and set up your account. This invitation will expire in 72 hours.
              </p>

              <!-- Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 6px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);">
                    <a href="${invitationUrl}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Or copy and paste this URL into your browser:
              </p>
              <p style="margin: 10px 0 0 0; color: #3b82f6; font-size: 14px; word-break: break-all;">
                ${invitationUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                © ${new Date().getFullYear()} ${ORGANIZATION_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textBody = `
You've Been Invited to ${ORGANIZATION_NAME}

Hello ${toName},

${invitedBy} has invited you to join ${ORGANIZATION_NAME} as a ${role}.

Accept your invitation by visiting this link:
${invitationUrl}

This invitation will expire in 72 hours.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} ${ORGANIZATION_NAME}
  `;

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: `Invitation to join ${ORGANIZATION_NAME}`,
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: textBody,
          Charset: 'UTF-8',
        },
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
      },
    },
  });

  try {
    const response = await client.send(command);
    console.log('Invitation email sent:', { toEmail, messageId: response.MessageId });
    return response;
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
}

/**
 * Send a welcome email after user accepts invitation
 */
export async function sendWelcomeEmail(toEmail: string, toName: string) {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to ${ORGANIZATION_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937;">Welcome to ${ORGANIZATION_NAME}!</h2>
              <p style="margin: 0 0 15px 0; color: #4b5563;">Hi ${toName},</p>
              <p style="margin: 0 0 15px 0; color: #4b5563;">
                Your account has been successfully activated. You can now log in and start using ${ORGANIZATION_NAME}.
              </p>
              <p style="margin: 0; color: #4b5563;">
                If you have any questions, please don't hesitate to reach out.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: `Welcome to ${ORGANIZATION_NAME}`,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
      },
    },
  });

  try {
    await client.send(command);
    console.log('Welcome email sent:', { toEmail });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw - this is non-critical
  }
}

export interface SendContactFormNotificationParams {
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
  messageId: string;
}

/**
 * Send a notification email to admins when a contact form is submitted
 */
export async function sendContactFormNotification(params: SendContactFormNotificationParams) {
  const { fromName, fromEmail, subject, message, messageId } = params;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                New Contact Form Submission
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                You have received a new message from the ${ORGANIZATION_NAME} website contact form.
              </p>

              <!-- Contact Details -->
              <table style="width: 100%; border-collapse: collapse; margin: 0 0 30px 0;">
                <tr>
                  <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151;">Name:</strong>
                  </td>
                  <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
                    ${fromName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151;">Email:</strong>
                  </td>
                  <td style="padding: 12px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb;">
                    <a href="mailto:${fromEmail}" style="color: #3b82f6; text-decoration: none;">
                      ${fromEmail}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151;">Subject:</strong>
                  </td>
                  <td style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
                    ${subject}
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 30px 0;">
                <p style="margin: 0 0 10px 0; color: #374151; font-weight: bold;">Message:</p>
                <p style="margin: 0; color: #4b5563; white-space: pre-wrap; line-height: 1.6;">${message}</p>
              </div>

              <!-- Action Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 6px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);">
                    <a href="mailto:${fromEmail}?subject=Re: ${encodeURIComponent(subject)}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 6px;">
                      Reply to ${fromName}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                Message ID: ${messageId}
              </p>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                © ${new Date().getFullYear()} ${ORGANIZATION_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textBody = `
New Contact Form Submission

You have received a new message from the ${ORGANIZATION_NAME} website contact form.

Name: ${fromName}
Email: ${fromEmail}
Subject: ${subject}

Message:
${message}

---
Reply to this message by emailing: ${fromEmail}

Message ID: ${messageId}
© ${new Date().getFullYear()} ${ORGANIZATION_NAME}
  `;

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    ReplyToAddresses: [fromEmail], // Allow direct reply to the sender
    Destination: {
      ToAddresses: [ADMIN_EMAIL],
    },
    Message: {
      Subject: {
        Data: `Contact Form: ${subject}`,
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: textBody,
          Charset: 'UTF-8',
        },
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
      },
    },
  });

  try {
    const response = await client.send(command);
    console.log('Contact form notification sent:', { toEmail: ADMIN_EMAIL, messageId: response.MessageId });
    return response;
  } catch (error) {
    console.error('Failed to send contact form notification:', error);
    throw new Error('Failed to send contact form notification');
  }
}
