/**
 * Seed script for development/testing
 * Run with: tsx packages/functions/src/scripts/seed.ts
 */

import { UserEntity, EventEntity, AnnouncementEntity } from '../db/entities';

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // Seed Users
    console.log('Creating users...');
    const users = [
      {
        id: 'admin-001',
        email: 'admin@cubscouts.org.uk',
        role: 'admin' as const,
        first_name: 'Jane',
        last_name: 'Smith',
      },
      {
        id: 'editor-001',
        email: 'editor@cubscouts.org.uk',
        role: 'editor' as const,
        first_name: 'John',
        last_name: 'Doe',
      },
      {
        id: 'viewer-001',
        email: 'viewer@cubscouts.org.uk',
        role: 'viewer' as const,
        first_name: 'Sarah',
        last_name: 'Johnson',
      },
    ];

    for (const user of users) {
      await UserEntity.create(user).go();
      console.log(`  ✓ Created user: ${user.email}`);
    }

    // Seed Events
    console.log('\nCreating events...');
    const events = [
      {
        title: 'Weekly Cub Meeting',
        event_type: 'meeting' as const,
        start_date: '2024-11-15T18:30:00Z',
        end_date: '2024-11-15T20:00:00Z',
        location: 'Scout Hall, Main Street',
        description:
          'Regular Friday evening Cub meeting. Activities include badge work and games.',
        cost: 0,
        what_to_bring: 'Cub uniform, water bottle',
        organizer_name: 'Jane Smith',
        organizer_contact: 'admin@cubscouts.org.uk',
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;BYDAY=FR',
        status: 'published' as const,
        created_by: 'admin-001',
      },
      {
        title: 'Winter Camp 2024',
        event_type: 'camp' as const,
        start_date: '2024-12-20T10:00:00Z',
        end_date: '2024-12-22T14:00:00Z',
        location: 'Woodlands Activity Centre, Hampshire',
        description:
          'Three-day winter camp with outdoor activities, campfire, and badge work. Cubs will stay in heated cabins.',
        cost: 75,
        what_to_bring: 'Sleeping bag, warm clothes, toiletries, torch',
        rsvp_deadline: '2024-12-01T23:59:59Z',
        organizer_name: 'John Doe',
        organizer_contact: 'editor@cubscouts.org.uk',
        is_recurring: false,
        status: 'published' as const,
        created_by: 'editor-001',
      },
      {
        title: 'Museum Trip',
        event_type: 'trip' as const,
        start_date: '2024-11-30T09:00:00Z',
        end_date: '2024-11-30T16:00:00Z',
        location: 'Natural History Museum, London',
        description: 'Day trip to the Natural History Museum with packed lunch.',
        cost: 15,
        what_to_bring: 'Packed lunch, water bottle, comfortable shoes',
        rsvp_deadline: '2024-11-20T23:59:59Z',
        organizer_name: 'Jane Smith',
        organizer_contact: 'admin@cubscouts.org.uk',
        is_recurring: false,
        status: 'published' as const,
        created_by: 'admin-001',
      },
      {
        title: 'Halloween Party',
        event_type: 'special' as const,
        start_date: '2024-10-31T18:00:00Z',
        end_date: '2024-10-31T20:30:00Z',
        location: 'Scout Hall, Main Street',
        description:
          'Halloween-themed party with games, costume competition, and spooky activities. Costumes encouraged!',
        cost: 5,
        what_to_bring: 'Halloween costume (optional)',
        rsvp_deadline: '2024-10-25T23:59:59Z',
        organizer_name: 'Sarah Johnson',
        organizer_contact: 'viewer@cubscouts.org.uk',
        is_recurring: false,
        status: 'published' as const,
        created_by: 'viewer-001',
      },
      {
        title: 'Christmas Carol Service',
        event_type: 'special' as const,
        start_date: '2024-12-15T14:00:00Z',
        end_date: '2024-12-15T15:30:00Z',
        location: 'St. Mary\'s Church, High Street',
        description:
          'Annual Christmas carol service for all sections. Cubs will perform readings and songs.',
        cost: 0,
        organizer_name: 'Jane Smith',
        organizer_contact: 'admin@cubscouts.org.uk',
        is_recurring: false,
        status: 'draft' as const,
        created_by: 'admin-001',
      },
    ];

    for (const event of events) {
      await EventEntity.create(event).go();
      console.log(`  ✓ Created event: ${event.title}`);
    }

    // Seed Announcements
    console.log('\nCreating announcements...');
    const announcements = [
      {
        title: 'Welcome to Cubs Site!',
        content:
          'Welcome to the new Cub Scout division website. Check the calendar for upcoming events and activities.',
        priority: 10,
        status: 'published' as const,
        created_by: 'admin-001',
      },
      {
        title: 'Winter Camp Registration Open',
        content:
          'Registration is now open for our Winter Camp in December. Places are limited - sign up soon!',
        priority: 8,
        expires_at: '2024-12-01T23:59:59Z',
        status: 'published' as const,
        created_by: 'editor-001',
      },
      {
        title: 'Uniform Reminder',
        content:
          'Please ensure Cubs wear full uniform to all meetings. Contact leaders if you need help with uniform items.',
        priority: 5,
        status: 'published' as const,
        created_by: 'admin-001',
      },
      {
        title: 'Parent Helper Request',
        content:
          'We\'re looking for parent volunteers to help with upcoming trips. Please contact a leader if you can assist.',
        priority: 6,
        expires_at: '2024-12-31T23:59:59Z',
        status: 'published' as const,
        created_by: 'editor-001',
      },
    ];

    for (const announcement of announcements) {
      await AnnouncementEntity.create(announcement).go();
      console.log(`  ✓ Created announcement: ${announcement.title}`);
    }

    console.log('\n✅ Seeding complete!\n');
    console.log('Sample data created:');
    console.log(`  - ${users.length} users`);
    console.log(`  - ${events.length} events`);
    console.log(`  - ${announcements.length} announcements\n`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
seed();
