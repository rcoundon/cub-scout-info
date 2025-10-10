import type { Event } from '../types/events';

/**
 * Generate iCalendar (.ics) format for events
 * Compatible with Google Calendar, Apple Calendar, Outlook, etc.
 */

/**
 * Format date for iCalendar (YYYYMMDDTHHMMSSZ format)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters in iCalendar text fields
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Fold long lines to meet iCalendar spec (max 75 characters per line)
 */
function foldLine(line: string): string {
  if (line.length <= 75) {
    return line;
  }

  const lines: string[] = [];
  let currentLine = line.substring(0, 75);
  let remaining = line.substring(75);

  lines.push(currentLine);

  while (remaining.length > 0) {
    currentLine = ' ' + remaining.substring(0, 74); // Add space for continuation
    remaining = remaining.substring(74);
    lines.push(currentLine);
  }

  return lines.join('\r\n');
}

/**
 * Generate iCalendar file for a single event
 */
export function generateICalEvent(event: Event): string {
  const lines: string[] = [];

  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Cubs Scout Group//Events//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('X-WR-CALNAME:Cubs Scout Events');
  lines.push('X-WR-TIMEZONE:Europe/London');

  lines.push('BEGIN:VEVENT');

  // Unique identifier
  lines.push(`UID:${event.id}@cubs-site`);

  // Timestamps
  const now = new Date();
  lines.push(`DTSTAMP:${formatICalDate(now)}`);
  lines.push(`CREATED:${formatICalDate(new Date(event.created_at))}`);
  lines.push(`LAST-MODIFIED:${formatICalDate(new Date(event.updated_at || event.created_at))}`);

  // Event times
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  lines.push(`DTSTART:${formatICalDate(startDate)}`);
  lines.push(`DTEND:${formatICalDate(endDate)}`);

  // Recurrence rule if applicable
  if (event.is_recurring && event.recurrence_rule) {
    lines.push(`RRULE:${event.recurrence_rule}`);
  }

  // Event details
  lines.push(foldLine(`SUMMARY:${escapeICalText(event.title)}`));
  lines.push(foldLine(`DESCRIPTION:${escapeICalText(event.description)}`));
  lines.push(foldLine(`LOCATION:${escapeICalText(event.location)}`));

  // Event type as category
  lines.push(`CATEGORIES:${event.event_type.toUpperCase()}`);

  // Status
  const status = event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED';
  lines.push(`STATUS:${status}`);

  // Additional details in description if present
  let extendedDescription = event.description;

  if (event.cost !== undefined && event.cost > 0) {
    extendedDescription += `\\n\\nCost: £${event.cost}`;
  }

  if (event.what_to_bring) {
    extendedDescription += `\\n\\nWhat to bring: ${escapeICalText(event.what_to_bring)}`;
  }

  if (event.organizer_name) {
    extendedDescription += `\\n\\nOrganizer: ${escapeICalText(event.organizer_name)}`;
    if (event.organizer_contact) {
      extendedDescription += ` (${escapeICalText(event.organizer_contact)})`;
    }
  }

  if (event.rsvp_deadline) {
    const rsvpDate = new Date(event.rsvp_deadline);
    extendedDescription += `\\n\\nRSVP by: ${rsvpDate.toLocaleDateString('en-GB')}`;
  }

  lines.push(foldLine(`DESCRIPTION:${extendedDescription}`));

  // Add reminders: 1 week before and 1 day before
  // 1 week reminder
  lines.push('BEGIN:VALARM');
  lines.push('ACTION:DISPLAY');
  lines.push('TRIGGER:-P7D');
  lines.push('DESCRIPTION:Event in 1 week');
  lines.push('END:VALARM');

  // 1 day reminder
  lines.push('BEGIN:VALARM');
  lines.push('ACTION:DISPLAY');
  lines.push('TRIGGER:-P1D');
  lines.push('DESCRIPTION:Event tomorrow');
  lines.push('END:VALARM');

  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Generate iCalendar file for multiple events (calendar feed)
 */
export function generateICalFeed(events: Event[]): string {
  const lines: string[] = [];

  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Cubs Scout Group//Events Calendar//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('X-WR-CALNAME:Cubs Scout Events');
  lines.push('X-WR-CALDESC:All Cubs Scout Group events and activities');
  lines.push('X-WR-TIMEZONE:Europe/London');

  // Add each event
  for (const event of events) {
    lines.push('BEGIN:VEVENT');

    lines.push(`UID:${event.id}@cubs-site`);

    const now = new Date();
    lines.push(`DTSTAMP:${formatICalDate(now)}`);
    lines.push(`CREATED:${formatICalDate(new Date(event.created_at))}`);
    lines.push(`LAST-MODIFIED:${formatICalDate(new Date(event.updated_at || event.created_at))}`);

    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    lines.push(`DTSTART:${formatICalDate(startDate)}`);
    lines.push(`DTEND:${formatICalDate(endDate)}`);

    if (event.is_recurring && event.recurrence_rule) {
      lines.push(`RRULE:${event.recurrence_rule}`);
    }

    lines.push(foldLine(`SUMMARY:${escapeICalText(event.title)}`));
    lines.push(foldLine(`DESCRIPTION:${escapeICalText(event.description)}`));
    lines.push(foldLine(`LOCATION:${escapeICalText(event.location)}`));
    lines.push(`CATEGORIES:${event.event_type.toUpperCase()}`);

    const status = event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED';
    lines.push(`STATUS:${status}`);

    // Add reminders: 1 week before and 1 day before
    // 1 week reminder
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push('TRIGGER:-P7D');
    lines.push('DESCRIPTION:Event in 1 week');
    lines.push('END:VALARM');

    // 1 day reminder
    lines.push('BEGIN:VALARM');
    lines.push('ACTION:DISPLAY');
    lines.push('TRIGGER:-P1D');
    lines.push('DESCRIPTION:Event tomorrow');
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}
