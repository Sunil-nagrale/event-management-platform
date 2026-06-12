require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Jaipur', 'Ahmedabad', 'Kochi'];

const sampleEvents = [
  { title: 'DevConf India 2026', category: 'technology', desc: 'Annual developer conference featuring keynotes from industry leaders, hands-on workshops, and networking sessions covering cloud, AI, and modern web development.', venue: 'Palace Grounds', price: 2499, capacity: 500, tags: ['developers', 'cloud', 'AI'] },
  { title: 'React Summit Bangalore', category: 'technology', desc: 'Deep dive into React 19, Server Components, and the modern frontend ecosystem with talks from core team members and community experts.', venue: 'NIMHANS Convention Center', price: 1999, capacity: 300, tags: ['react', 'frontend'] },
  { title: 'AI & Machine Learning Expo', category: 'technology', desc: 'Explore the latest in artificial intelligence, deep learning frameworks, and real-world ML deployments across industries.', venue: 'BIEC', price: 1499, capacity: 400, tags: ['AI', 'ML', 'data-science'] },
  { title: 'Cybersecurity Conference 2026', category: 'technology', desc: 'Learn about zero-trust architecture, penetration testing, and securing cloud-native applications from top security researchers.', venue: 'Hotel Taj West End', price: 2999, capacity: 250, tags: ['security', 'cloud'] },
  { title: 'DevOps Days Mumbai', category: 'technology', desc: 'Two days of DevOps culture, CI/CD pipelines, Kubernetes, and infrastructure as code with open spaces and lightning talks.', venue: 'Jio World Convention Centre', price: 1799, capacity: 350, tags: ['devops', 'kubernetes'] },
  { title: 'Blockchain & Web3 Summit', category: 'technology', desc: 'Discover decentralized applications, smart contracts, and the future of digital ownership with leading blockchain innovators.', venue: 'World Trade Center', price: 999, capacity: 200, tags: ['blockchain', 'web3'] },
  { title: 'Diwali Cultural Festival', category: 'cultural', desc: 'Celebrate the festival of lights with traditional dance performances, rangoli competitions, food stalls, and a spectacular fireworks display.', venue: 'India Gate Lawns', price: 0, capacity: 2000, tags: ['diwali', 'festival', 'family'] },
  { title: 'Heritage Walk & Art Exhibition', category: 'cultural', desc: 'Guided heritage walk through historic neighborhoods followed by an exhibition featuring local artists and traditional crafts.', venue: 'City Museum', price: 299, capacity: 150, tags: ['heritage', 'art'] },
  { title: 'International Food & Culture Fair', category: 'cultural', desc: 'Taste cuisines from around the world, enjoy cultural performances, and participate in cooking demonstrations.', venue: 'NSCI Dome', price: 499, capacity: 800, tags: ['food', 'culture'] },
  { title: 'Classical Music Evening', category: 'cultural', desc: 'An enchanting evening of Hindustani and Carnatic classical music featuring renowned maestros and emerging talents.', venue: 'NCPA', price: 799, capacity: 400, tags: ['music', 'classical'] },
  { title: 'Photography Masterclass', category: 'workshop', desc: 'Learn portrait, landscape, and street photography techniques from award-winning photographers. Includes hands-on outdoor sessions.', venue: 'Creative Studio Hub', price: 1499, capacity: 30, tags: ['photography', 'creative'] },
  { title: 'Full-Stack Web Development Bootcamp', category: 'workshop', desc: 'Intensive 2-day workshop covering Node.js, Express, MongoDB, and React. Build a complete project from scratch.', venue: 'Tech Park Auditorium', price: 2999, capacity: 50, tags: ['web-dev', 'nodejs'] },
  { title: 'UI/UX Design Workshop', category: 'workshop', desc: 'Master design thinking, wireframing, prototyping with Figma, and user research methodologies for digital products.', venue: 'Design Collective', price: 1999, capacity: 40, tags: ['design', 'UX', 'figma'] },
  { title: 'Public Speaking & Leadership', category: 'workshop', desc: 'Build confidence in public speaking, learn storytelling techniques, and develop leadership communication skills.', venue: 'Toastmasters Hall', price: 999, capacity: 60, tags: ['leadership', 'communication'] },
  { title: 'Digital Marketing Intensive', category: 'workshop', desc: 'Hands-on training in SEO, social media marketing, Google Ads, and analytics to grow your brand online.', venue: 'Marketing Academy', price: 2499, capacity: 45, tags: ['marketing', 'SEO'] },
  { title: 'Sunburn Arena - Electronic Night', category: 'concert', desc: 'Experience the biggest electronic dance music event with international DJs, stunning visuals, and an unforgettable night.', venue: 'Mahalaxmi Race Course', price: 3499, capacity: 5000, tags: ['EDM', 'music', 'nightlife'] },
  { title: 'Indie Rock Live', category: 'concert', desc: 'Live performances from top indie rock bands featuring original compositions and crowd-favorite covers.', venue: 'Blue Frog', price: 899, capacity: 500, tags: ['rock', 'live-music'] },
  { title: 'Jazz Under the Stars', category: 'concert', desc: 'An intimate open-air jazz concert featuring saxophone, piano, and vocal performances in a beautiful garden setting.', venue: 'Lalbagh Botanical Garden', price: 699, capacity: 300, tags: ['jazz', 'outdoor'] },
  { title: 'Bollywood Night Live', category: 'concert', desc: 'Sing along to your favorite Bollywood hits with live band performances and special guest appearances.', venue: 'NSCI Stadium', price: 1299, capacity: 2000, tags: ['bollywood', 'live'] },
  { title: 'Acoustic Unplugged Session', category: 'concert', desc: 'Stripped-down acoustic performances in an cozy venue setting with emerging and established singer-songwriters.', venue: 'The Piano Man Jazz Club', price: 599, capacity: 120, tags: ['acoustic', 'unplugged'] },
  { title: 'Hackathon 48 - Build the Future', category: 'hackathon', desc: '48-hour coding marathon to build innovative solutions. Themes include healthtech, edtech, and sustainability. Prizes worth ₹5 lakhs.', venue: 'IIT Campus', price: 0, capacity: 200, tags: ['coding', 'innovation', 'prizes'] },
  { title: 'AI Hackathon 2026', category: 'hackathon', desc: 'Build AI-powered applications in 24 hours. Mentorship from industry experts and access to GPU cloud credits.', venue: 'T-Hub', price: 0, capacity: 150, tags: ['AI', 'hackathon'] },
  { title: 'FinTech Innovation Challenge', category: 'hackathon', desc: 'Create next-generation financial technology solutions. Open to developers, designers, and business minds.', venue: 'BSE Convention Hall', price: 499, capacity: 100, tags: ['fintech', 'startup'] },
  { title: 'Green Tech Hackathon', category: 'hackathon', desc: 'Develop technology solutions for climate change, renewable energy, and sustainable living challenges.', venue: 'Green Innovation Center', price: 0, capacity: 120, tags: ['climate', 'sustainability'] },
  { title: 'HealthTech Buildathon', category: 'hackathon', desc: 'Build applications that improve healthcare access, patient monitoring, and medical diagnostics.', venue: 'Medical Innovation Hub', price: 0, capacity: 80, tags: ['healthtech', 'medical'] },
  { title: 'Startup Networking Mixer', category: 'networking', desc: 'Connect with founders, investors, and mentors in an informal setting. Pitch sessions and fireside chats included.', venue: 'WeWork Galaxy', price: 499, capacity: 100, tags: ['startup', 'networking'] },
  { title: 'Women in Tech Meetup', category: 'networking', desc: 'Empowering women in technology through panel discussions, mentorship circles, and career development sessions.', venue: 'Google Office', price: 0, capacity: 150, tags: ['women-in-tech', 'diversity'] },
  { title: 'Cloud Architects Roundtable', category: 'networking', desc: 'Exclusive networking event for cloud architects and engineers to share best practices and architecture patterns.', venue: 'AWS Office', price: 999, capacity: 50, tags: ['cloud', 'architecture'] },
  { title: 'Marathon 2026 - Run for a Cause', category: 'sports', desc: 'Annual charity marathon with 5K, 10K, and half-marathon categories. Proceeds support education for underprivileged children.', venue: 'Marine Drive', price: 799, capacity: 3000, tags: ['marathon', 'charity', 'fitness'] },
  { title: 'Cricket Fan Fest', category: 'sports', desc: 'Watch live screening of international matches, participate in cricket workshops, and meet former cricketers.', venue: 'Wankhede Stadium Fan Zone', price: 499, capacity: 1000, tags: ['cricket', 'sports'] }
];

const randomDate = (minDays, maxDays) => {
  const now = new Date();
  const days = minDays + Math.floor(Math.random() * (maxDays - minDays));
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(9 + Math.floor(Math.random() * 10), [0, 30][Math.floor(Math.random() * 2)], 0, 0);
  return date;
};

const seed = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({})
    ]);

    console.log('Creating users...');
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@eventhub.com',
      role: 'admin'
    });
    await admin.setPassword('admin123');
    await admin.save();

    const organizers = [];
    const organizerData = [
      { firstName: 'Priya', lastName: 'Sharma', email: 'priya@organizer.com' },
      { firstName: 'Rahul', lastName: 'Verma', email: 'rahul@organizer.com' },
      { firstName: 'Ananya', lastName: 'Patel', email: 'ananya@organizer.com' }
    ];

    for (const data of organizerData) {
      const org = new User({ ...data, role: 'organizer' });
      await org.setPassword('organizer123');
      await org.save();
      organizers.push(org);
    }

    const attendee = new User({
      firstName: 'Demo',
      lastName: 'Attendee',
      email: 'attendee@eventhub.com',
      role: 'attendee'
    });
    await attendee.setPassword('attendee123');
    await attendee.save();

    console.log('Creating 30 sample events...');
    const events = [];

    for (let i = 0; i < sampleEvents.length; i++) {
      const sample = sampleEvents[i];
      const start = randomDate(7, 90);
      const end = new Date(start);
      end.setHours(end.getHours() + 4 + Math.floor(Math.random() * 8));

      const city = cities[i % cities.length];
      const organizer = organizers[i % organizers.length];

      const event = await Event.create({
        title: sample.title,
        description: sample.desc,
        category: sample.category,
        location: {
          venue: sample.venue,
          city,
          address: `${sample.venue}, ${city}, India`
        },
        dateTime: { start, end },
        capacity: sample.capacity,
        ticketPrice: sample.price,
        status: 'published',
        organizer: organizer._id,
        tags: sample.tags,
        image: {
          url: `https://picsum.photos/seed/event${i + 1}/800/450`,
          publicId: ''
        }
      });

      events.push(event);
    }

    console.log('\n✅ Seed completed successfully!\n');
    console.log('Login credentials:');
    console.log('  Admin:     admin@eventhub.com / admin123');
    console.log('  Organizer: priya@organizer.com / organizer123');
    console.log('  Attendee:  attendee@eventhub.com / attendee123');
    console.log(`\n  Created ${events.length} events across ${cities.length} cities.`);

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
