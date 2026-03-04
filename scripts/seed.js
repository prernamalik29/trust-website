/**
 * seed.js — One-time Firestore database seeder
 * Olympian Anuj International Trust
 *
 * SETUP (run once before first use):
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Click "Generate new private key" → save as scripts/serviceAccountKey.json
 *   3. cd scripts && npm install
 *      node seed.js              (seed everything)
 *      node seed.js --dry-run    (preview without writing)
 *      node seed.js events       (seed only events collection)
 *      node seed.js stats        (seed only stats document)
 *      node seed.js causes       (seed only causes)
 *      node seed.js testimonials (seed only testimonials)
 *      node seed.js blog         (seed only blog posts)
 *
 * IDEMPOTENT: existing documents are skipped — safe to re-run.
 */

'use strict';

const admin   = require('firebase-admin');
const path    = require('path');
const fs      = require('fs');

// ─── Args ────────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY    = args.filter(a => !a.startsWith('--'));   // e.g. ['events']

// ─── Init Firebase Admin ──────────────────────────────────────────────────────
const keyPath = path.resolve(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('\n❌  scripts/serviceAccountKey.json not found.');
  console.error('   Download it from Firebase Console → Project Settings → Service Accounts.\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(keyPath)),
  projectId:  'trust-website-5a814',
});

const db = admin.firestore();

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function seedCollection(collectionName, records, keyFn = null) {
  console.log(`\n📂  Seeding '${collectionName}' (${records.length} records)...`);
  let created = 0, skipped = 0;

  for (const record of records) {
    const docId  = keyFn ? keyFn(record) : null;
    const docRef = docId
      ? db.collection(collectionName).doc(docId)
      : db.collection(collectionName).doc();   // auto-id

    const snap = await docRef.get();
    if (snap.exists) {
      console.log(`  ⏭   skip  ${docId || docRef.id} (already exists)`);
      skipped++;
      continue;
    }

    const data = {
      ...record,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (DRY_RUN) {
      console.log(`  🔍  [DRY] would create ${docRef.id}:`, JSON.stringify(record).slice(0, 80));
    } else {
      await docRef.set(data);
      console.log(`  ✅  created  ${docRef.id}`);
    }
    created++;
  }

  console.log(`  → ${created} created, ${skipped} skipped`);
}

async function seedDoc(collectionName, docId, data) {
  console.log(`\n📄  Seeding '${collectionName}/${docId}'...`);
  const ref  = db.collection(collectionName).doc(docId);
  const snap = await ref.get();

  if (snap.exists) {
    console.log('  ⏭   skip (already exists)');
    return;
  }

  const payload = { ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() };

  if (DRY_RUN) {
    console.log('  🔍  [DRY] would create:', JSON.stringify(data).slice(0, 120));
  } else {
    await ref.set(payload);
    console.log('  ✅  created');
  }
}

// ─── Seed data ────────────────────────────────────────────────────────────────

// Month abbreviations for day/month/year fields
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Read all event JSON files from ../data/events/
function loadEventsFromDisk() {
  const dataDir   = path.resolve(__dirname, '../data/events');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) return [];
  const files = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

  return files.map(file => {
    const raw = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    // Parse date — use UTC to avoid timezone shifts
    const d = raw.date ? new Date(raw.date) : new Date();
    return {
      title:       raw.title || '',
      // JSON files use 'image' key — map to 'imageUrl' which the app expects
      imageUrl:    raw.imageUrl || raw.image || null,
      // Derived display fields used by admin table and public website
      day:         String(d.getUTCDate()).padStart(2, '0'),
      month:       MONTH_ABBR[d.getUTCMonth()],
      year:        String(d.getUTCFullYear()),
      time:        raw.time || 'TBA',
      location:    raw.location || '',
      category:    raw.category || 'general',
      description: raw.description || '',
      // Firestore Timestamp for ordering queries
      date:        admin.firestore.Timestamp.fromDate(d),
      status:      'upcoming',
      featured:    false,
    };
  });
}

const STATS_DATA = {
  totalDonations:   2500000,   // ₹
  volunteers:       350,
  eventsOrganized:  125,
  childrenSupported: 5000,
};

// Sample causes — field names MUST match what admin/public expects: imageUrl, raisedAmount, goalAmount
const CAUSES_DATA = [
  {
    title:        'Sports Development',
    description:  'Providing sports training, equipment, and coaching to underprivileged youth to help them excel in athletics and build discipline.',
    imageUrl:     '/assets/sport-section/new-event-08-03-2026.jpeg',
    raisedAmount: 850000,
    goalAmount:   1500000,
    category:     'sports',
    status:       'active',
  },
  {
    title:        'Health & Medical Aid',
    description:  'Organising free health camps, diagnostic tests, and distributing medicines to communities without access to healthcare.',
    imageUrl:     'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&q=80',
    raisedAmount: 620000,
    goalAmount:   1200000,
    category:     'health',
    status:       'active',
  },
  {
    title:        'Food for Children',
    description:  'Distributing nutritious meals and food kits to underprivileged children and families across communities to combat hunger and malnutrition.',
    imageUrl:     'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500&q=80',
    raisedAmount: 310000,
    goalAmount:   800000,
    category:     'food',
    status:       'active',
  },
];

// Sample testimonials — fields: name, role, imageUrl, quote
const TESTIMONIALS_DATA = [
  {
    name:     'Rajesh Kumar',
    role:     'Sports Volunteer',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
    quote:    'Volunteering with Olympian Anuj International Trust has been a life-changing experience. Seeing the smiles on children\'s faces when they receive their sports kits is priceless.',
  },
  {
    name:     'Priya Sharma',
    role:     'Healthcare Camp Participant',
    imageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b131?w=150&q=80',
    quote:    'The free health camp detected my father\'s blood pressure issue early. We are truly grateful for their dedication to community healthcare.',
  },
  {
    name:     'Amit Singh',
    role:     'Community Leader, Muzaffarnagar',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    quote:    'The food distribution program has made a real difference in our community. Hundreds of children now go to bed with full stomachs because of this trust.',
  },
];

// Sample blog posts — fields: title, imageUrl, date, author, commentsCount, description, content
const BLOG_DATA = [
  {
    title:         'Annual Sports Championship 2026: Highlights and Achievements',
    imageUrl:      '/assets/sport-section/new-event-08-03-2026.jpeg',
    date:          '2026-03-08',
    author:        'Admin',
    commentsCount: 0,
    description:   'Our biggest sports event of the year was a tremendous success, with over 500 young athletes competing across 12 disciplines. Here are the highlights.',
    content:       'The Annual Sports Championship 2026 brought together young athletes from across Muzaffarnagar and neighboring districts for a day of fierce, fair competition and incredible sportsmanship.\n\nOver 500 participants competed in 12 disciplines including athletics, football, kabaddi, wrestling, and more. The event was inaugurated by our founder and Olympian Anuj Kumar, who inspired the crowd with his own journey from a small village to the international stage.\n\nKey Highlights:\n- 500+ athletes participated\n- 12 sports disciplines\n- 120 medals awarded\n- Special recognition ceremony for top performers\n- Free sports kits distributed to all participants\n\nWe extend our heartfelt gratitude to all volunteers, sponsors, and supporters who made this event possible.',
  },
  {
    title:         'Free Health Checkup Camp — 1,200 Lives Reached',
    imageUrl:      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&q=80',
    date:          '2026-03-15',
    author:        'Admin',
    commentsCount: 0,
    description:   'Our March health camp provided free medical consultations, diagnostics, and medicines to over 1,200 community members in a single day.',
    content:       'On March 15, 2026, Olympian Anuj International Trust organized a Free Health Checkup Camp at the Community Center, reaching over 1,200 individuals from underserved backgrounds.\n\nServices Provided:\n- General health consultations\n- Blood pressure and diabetes screening\n- Eye testing and corrective lens distribution\n- Free medicines worth ₹3.5 lakhs\n- Nutritional guidance for mothers and children\n\nA team of 35 volunteer doctors, nurses, and paramedics gave their time without charge. Early detection of hypertension and anemia means these individuals can now seek treatment before conditions worsen.\n\nWe plan to run quarterly health camps throughout 2026. If you are a medical professional who would like to volunteer, please reach out through our Volunteer page.',
  },
  {
    title:         'Community Food Distribution: Feeding Families Every Month',
    imageUrl:      'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500&q=80',
    date:          '2026-03-22',
    author:        'Admin',
    commentsCount: 0,
    description:   'Each month we distribute food kits to hundreds of families. Learn how our community food drive works and how you can help.',
    content:       'Food insecurity affects millions of families across India. At Olympian Anuj International Trust, we believe no child should go to school on an empty stomach.\n\nOur monthly Community Food Distribution program provides:\n- 5 kg rice per family\n- 2 kg dal (lentils)\n- 1 litre cooking oil\n- Essential spices and condiments\n- Nutritional biscuits for children\n\nIn March 2026, we distributed food kits to 350 families across 6 locations in Muzaffarnagar district. Since starting this program in 2019, we have distributed over 50,000 food kits.\n\nHow You Can Help:\n1. Donate — even ₹500 feeds a family for a month\n2. Volunteer — join our distribution drives on the last Sunday of each month\n3. Sponsor — partner with us to sponsor an entire distribution event\n\nThank you to all our donors and volunteers who make this possible every single month.',
  },
];

// ─── Run ──────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) console.log('\n🔍  DRY-RUN mode — nothing will be written to Firestore.\n');
  console.log('🚀  Starting Firestore seed for project: trust-website-5a814');

  const runAll = ONLY.length === 0;

  if (runAll || ONLY.includes('events')) {
    const events = loadEventsFromDisk();
    if (events.length) {
      await seedCollection('events', events, e => {
        // Use the filename-style slug as document ID for determinism
        const d = new Date(e.date?.toDate ? e.date.toDate() : e.date);
        const dateStr = d.toISOString().slice(0, 10);
        return `${dateStr}-${e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
      });
    } else {
      console.log('\n⚠️   No event JSON files found in data/events/');
    }
  }

  if (runAll || ONLY.includes('stats')) {
    await seedDoc('stats', 'siteStats', STATS_DATA);
  }

  if (runAll || ONLY.includes('causes')) {
    await seedCollection('causes', CAUSES_DATA);
  }

  if (runAll || ONLY.includes('testimonials')) {
    await seedCollection('testimonials', TESTIMONIALS_DATA);
  }

  if (runAll || ONLY.includes('blog')) {
    await seedCollection('blog', BLOG_DATA);
  }

  console.log('\n🎉  Seed complete!\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
