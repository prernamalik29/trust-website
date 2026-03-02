/**
 * seed.js — One-time Firestore database seeder
 * Olympian Anuj International Trust
 *
 * SETUP (run once before first use):
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Click "Generate new private key" → save as scripts/serviceAccountKey.json
 *   3. cd scripts && npm install
 *   4. node seed.js           (seed everything)
 *      node seed.js --dry-run (preview without writing)
 *      node seed.js events    (seed only events collection)
 *      node seed.js stats     (seed only stats document)
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

// Read all event JSON files from ../data/events/
function loadEventsFromDisk() {
  const dataDir  = path.resolve(__dirname, '../data/events');
  const indexPath = path.join(dataDir, 'index.json');

  if (!fs.existsSync(indexPath)) return [];
  const files = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

  return files.map(file => {
    const raw = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    return {
      ...raw,
      date:     raw.date ? admin.firestore.Timestamp.fromDate(new Date(raw.date)) : null,
      status:   'upcoming',
      featured: false,
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
    title:        'Child Education',
    description:  'Funding school fees, books, uniforms, and digital learning tools for children from low-income families.',
    imageUrl:     'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=500&q=80',
    raisedAmount: 430000,
    goalAmount:   900000,
    category:     'education',
    status:       'active',
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

  console.log('\n🎉  Seed complete!\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
