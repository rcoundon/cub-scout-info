# Cubs Site Admin Guide

This guide is for administrators and editors who manage the Cubs Scout Group website. It covers all administrative functions including event management, announcements, user administration, and content moderation.

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Dashboard Overview](#dashboard-overview)
4. [Event Management](#event-management)
5. [Announcement Management](#announcement-management)
6. [User Management](#user-management)
7. [Contact Form Management](#contact-form-management)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing Admin Panel

1. Navigate to the website
2. Click **Login** in the top right
3. Enter your admin credentials
4. You'll be redirected to the admin dashboard

### Admin URL

Direct access: `https://your-site.com/admin`

### First Login

On your first login:

1. Change your password immediately
2. Familiarize yourself with the dashboard layout
3. Review existing events and announcements
4. Check user list and permissions

---

## User Roles & Permissions

The system has three user roles with different permission levels:

### Admin

**Full system access** including:

- ✅ Create, edit, delete events
- ✅ Create, edit, delete announcements
- ✅ Manage users (create, edit, delete, change roles)
- ✅ View and respond to contact form submissions
- ✅ Upload and manage files
- ✅ Access all admin sections
- ✅ Change system settings

**Use Case**: Group leaders, committee members

### Editor

**Content management** access:

- ✅ Create, edit, delete events
- ✅ Create, edit, delete announcements
- ✅ Upload files to events
- ✅ View contact form submissions
- ❌ Cannot manage users
- ❌ Cannot change system settings

**Use Case**: Section leaders, assistant leaders

### Viewer

**Read-only** access:

- ✅ View all events and announcements
- ✅ View contact form submissions
- ❌ Cannot create or edit content
- ❌ Cannot manage users
- ❌ Limited admin panel access

**Use Case**: Committee members, volunteers who need visibility

---

## Dashboard Overview

### Main Dashboard

After logging in, you'll see:

- **Quick Stats**: Number of upcoming events, recent announcements
- **Recent Activity**: Latest events created, announcements posted
- **Quick Actions**: Buttons to create events, announcements
- **Navigation Menu**: Access to all admin sections

### Navigation

The admin sidebar includes:

- **Dashboard**: Overview and stats
- **Events**: Manage all events
- **Announcements**: Manage announcements
- **Users**: User administration (admins only)
- **Contact**: View contact form submissions
- **Back to Site**: Return to public website

---

## Event Management

### Viewing Events

1. Click **Events** in the admin menu
2. See all events in a list view
3. Use filters to find specific events:
   - Search by title/description
   - Filter by status (Published, Draft, Cancelled)
   - Sort by date

### Creating an Event

1. Click **Create Event** button
2. Fill in the event details:

#### Basic Information

- **Title**: Event name (e.g., "Cubs Camp 2024")
- **Description**: Full details of the activity
- **Event Type**: Meeting, Camp, Activity, Trip, etc.
- **Age Group**: Beavers, Cubs, Scouts, or All

#### Date & Time

- **Start Date**: When the event begins
- **End Date**: When it ends (optional for single-day events)
- **Start Time**: Time to arrive
- **End Time**: Time to pick up

#### Location & Cost

- **Location**: Where to meet (e.g., "Scout Hut, Parish Piece")
- **Cost**: Any fees (leave blank if free)
- **Max Attendees**: Capacity limit (optional)

#### Additional Details

- **Requirements**: What to bring, special instructions
- **Notes**: Internal notes for leaders (not shown publicly)
- **Attachments**: Upload permission forms, maps, etc.

3. Choose event status:
   - **Draft**: Save without publishing (only visible to admins)
   - **Published**: Make visible to all users
   - **Cancelled**: Mark as cancelled (shows with strikethrough)

4. Click **Save Event**

### Recurring Events

To create a recurring event:

1. Check **Recurring Event** checkbox
2. Set recurrence pattern:
   - **Frequency**: Daily, Weekly, or Monthly
   - **End Date**: When series ends
   - **Days of Week**: For weekly events (e.g., Tuesday meetings)

3. The system will create multiple occurrences automatically

### Editing Events

1. Find the event in the list
2. Click **Edit** button
3. Modify any fields
4. Click **Save Changes**

### Deleting Events

1. Find the event in the list
2. Click **Delete** button
3. Confirm deletion
4. Event is permanently removed

**⚠️ Warning**: Deleted events cannot be recovered. Consider using "Cancelled" status instead.

### Publishing Events

Draft events can be published:

1. Edit the draft event
2. Change status to **Published**
3. Save changes
4. Event now appears on public site

**Note:** Published events are automatically available for export:
- Users can subscribe to the full calendar feed for automatic updates
- Individual events can be added to Google Calendar or downloaded as .ics files
- Calendar feeds update automatically when you add, modify, or cancel events

### Cancelling Events

To cancel an event:

1. Edit the event
2. Change status to **Cancelled**
3. Optionally update description with cancellation reason
4. Save changes
5. Event shows as cancelled on website

### File Attachments

Upload files to events:

1. Edit an event
2. Scroll to **Attachments** section
3. Click **Upload File**
4. Select file (PDF, images, documents)
5. Add description
6. Save

**Supported formats**: PDF, JPEG, PNG, DOC, DOCX
**Max file size**: 10MB per file

---

## Announcement Management

### Viewing Announcements

1. Click **Announcements** in admin menu
2. See all announcements sorted by date
3. Filter by priority or search

### Creating an Announcement

1. Click **Create Announcement**
2. Fill in details:

#### Content

- **Title**: Announcement heading
- **Content**: Full announcement text (supports rich formatting)
- **Priority**:
  - **High** (Red badge): Urgent, time-sensitive
  - **Normal** (Blue badge): General updates
  - **Low** (Green badge): Nice-to-know info

#### Visibility

- **Published**: Make live immediately
- **Draft**: Save without publishing
- **Scheduled**: Set future publish date (optional)

#### Targeting

- **Age Groups**: Select which sections to show to (optional)
- **Expiry Date**: Auto-hide after date (optional)

3. Click **Save Announcement**

### Editing Announcements

1. Find announcement in list
2. Click **Edit**
3. Modify content
4. Save changes

### Deleting Announcements

1. Select announcement
2. Click **Delete**
3. Confirm deletion

### Pinning Announcements

Pin important announcements to top:

1. Edit announcement
2. Check **Pin to Top** option
3. Save
4. Announcement appears first in list

---

## User Management

**Note**: Only Admins can access user management

### Viewing Users

1. Click **Users** in admin menu
2. See list of all users
3. Use filters:
   - Search by name or email
   - Filter by role (Admin, Editor, Viewer)
   - Sort by last login or created date

### Creating Users

1. Click **Create User**
2. Enter details:
   - **Email**: User's email address
   - **First Name**: User's first name
   - **Last Name**: User's last name
   - **Role**: Select appropriate role
   - **Password**: Temporary password (user can change)

3. Click **Create User**
4. User receives welcome email with login details

### Editing Users

1. Find user in list
2. Click **Edit**
3. Update:
   - Name
   - Email
   - Role (change permissions)
   - Status (active/inactive)

4. Save changes

### Changing User Roles

To promote/demote a user:

1. Edit the user
2. Select new role from dropdown
3. Confirm role change
4. User's permissions update immediately

**Role Changes**:
- Viewer → Editor: Grants content creation
- Editor → Admin: Grants full access
- Admin → Editor: Removes user management
- Any → Viewer: Restricts to read-only

### Deactivating Users

Instead of deleting:

1. Edit user
2. Change status to **Inactive**
3. Save
4. User cannot log in but data is preserved

### Deleting Users

**⚠️ Use with caution**:

1. Select user
2. Click **Delete**
3. Confirm deletion
4. User and their data removed permanently

**Cannot delete**:
- Your own account
- Users with pending activities

---

## Contact Form Management

### Viewing Submissions

1. Click **Contact** in admin menu
2. See all contact form submissions
3. Filter by:
   - Date range
   - Status (New, Read, Responded)
   - Subject

### Reading Messages

1. Click on a submission
2. View:
   - Sender name and email
   - Subject
   - Full message
   - Date/time received
   - User's IP (for spam detection)

### Responding to Messages

1. Open message
2. Click **Reply** button
3. Compose response
4. Message sent to submitter's email
5. Submission marked as "Responded"

### Managing Submissions

Actions:

- **Mark as Read**: Track which you've reviewed
- **Archive**: Move to archive (removes from main list)
- **Delete**: Permanently remove spam
- **Export**: Download as CSV for records

### Spam Prevention

If you receive spam:

1. Mark as spam
2. Delete submission
3. Block sender's email (optional)
4. Report persistent spam to tech support

---

## Best Practices

### Event Management

**DO**:
- Create events at least 2 weeks in advance
- Include all necessary details (what to bring, cost, etc.)
- Set realistic capacity limits
- Use clear, descriptive titles
- Attach relevant forms early
- Update status promptly if cancelled

**DON'T**:
- Delete published events (cancel instead to maintain history)
- Use abbreviations parents may not understand
- Forget to set end dates for multi-day events
- Leave cost field blank if there's a fee

### Announcements

**DO**:
- Use priority levels appropriately
- Keep announcements concise
- Set expiry dates for time-sensitive info
- Preview before publishing
- Include links to related events
- Use proper formatting for readability

**DON'T**:
- Mark everything as high priority
- Post redundant information
- Use all caps (except for emphasis)
- Include personal contact info publicly

### User Management

**DO**:
- Review user access quarterly
- Use minimum necessary permissions
- Document why admin access was granted
- Remind users to change default passwords
- Remove access for inactive members promptly

**DON'T**:
- Share login credentials
- Give admin access unnecessarily
- Delete users who created content
- Change someone's role without discussing

### Security

**DO**:
- Change your password regularly
- Use strong, unique passwords
- Log out when using shared computers
- Enable two-factor authentication (if available)
- Report suspicious activity immediately

**DON'T**:
- Share your admin account
- Save passwords in browser on public computers
- Click suspicious links in emails
- Ignore security warnings

---

## Troubleshooting

### Common Issues

#### Can't Login

1. Check caps lock is off
2. Try password reset
3. Confirm you have correct email
4. Clear browser cache
5. Try different browser
6. Contact system admin

#### Event Not Appearing

Check:
- ✓ Event is Published (not Draft)
- ✓ Start date is in future
- ✓ Event isn't Cancelled
- ✓ Correct age group selected
- ✓ Page cache refreshed

#### File Upload Fails

Solutions:
- Check file size (<10MB)
- Verify file type is supported
- Try different browser
- Check internet connection
- Compress large files

#### Can't Edit Event/Announcement

Possible causes:
- Insufficient permissions (need Editor/Admin)
- Content is locked by another user
- Session expired (re-login required)

### Getting Help

#### Technical Support

- **Email**: techsupport@example.com
- **Phone**: 01234 567890 (Mon-Fri, 9am-5pm)
- **Documentation**: Check this guide first
- **System Status**: status.yoursite.com

#### Escalation

For urgent issues:

1. Contact primary admin
2. Call technical support
3. Email emergency contact
4. Check status page for outages

---

## Advanced Features

### Bulk Actions

Manage multiple items at once:

1. Select checkboxes next to items
2. Choose action from dropdown:
   - Publish/Unpublish
   - Change status
   - Delete
   - Export

3. Confirm action
4. Changes apply to all selected

### Filtering & Search

Advanced search options:

- **Date Range**: Find events in specific period
- **Custom Fields**: Search by any field
- **Saved Filters**: Save frequent searches
- **Export Results**: Download filtered lists

### Reports & Analytics

Access reports for:

- Event attendance trends
- Popular event types
- User engagement
- Contact form volumes

### Keyboard Shortcuts

Speed up admin work:

- `Ctrl/Cmd + S`: Save current form
- `Ctrl/Cmd + E`: Edit selected item
- `Ctrl/Cmd + N`: Create new (context-aware)
- `Esc`: Close modal/dialog
- `/`: Focus search

---

## Appendix

### Event Status Reference

| Status | Meaning | Visible to Users? |
|--------|---------|-------------------|
| Draft | Work in progress | No |
| Published | Live event | Yes |
| Cancelled | Event cancelled | Yes (strikethrough) |

### Priority Levels

| Priority | Color | When to Use |
|----------|-------|-------------|
| High | Red | Urgent, time-sensitive, safety notices |
| Normal | Yellow | Regular updates, general info |
| Low | Grey | Optional info, nice-to-know |

### File Types Supported

**Documents**: PDF, DOC, DOCX, TXT
**Images**: JPEG, JPG, PNG, GIF
**Spreadsheets**: XLS, XLSX, CSV
**Max Size**: 10MB per file

### Quick Reference

**Create Event**: Admin → Events → Create Event
**Create Announcement**: Admin → Announcements → Create
**Manage Users**: Admin → Users (Admins only)
**Contact Forms**: Admin → Contact

---

## Updates & Changelog

This guide is regularly updated. Check back for:

- New feature documentation
- Best practice updates
- Security advisories
- System changes

**Last Updated**: [Current Date]
**Version**: 1.0

---

**Questions?** Contact your system administrator or refer to the technical documentation at `/docs`
