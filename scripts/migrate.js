/**
 * migrate.js — One-time Firestore data migration
 * Olympian Anuj International Trust
 *
 * Fixes four classes of pre-existing data problems identified in the audit:
 *
 *   [1] causes       — wrong field names written by old seed.js
 *                      (image→imageUrl, raised→raisedAmount, goal→goalAmount)
 *   [2] event_regs   — age stored as string instead of number
 *   [3] events       — admin-created docs missing status field → add 'upcoming'
 *   [4] newsletter   — duplicate emails → keep earliest, delete duplicates
 *
 * SETUP (same as seed.js):
 *   1. Place scripts/serviceAccountKey.json (from Firebase Console → Service Accounts)
 *   2. cd scripts && npm install
 *
 * USAGE:
 *   node migrate.js               — run all migrations with changes applied
 *   node migrate.js --dry-run     — preview only, no writes
 *   node migrate.js causes        — run only the causes fix
 *   node migrate.js ages          — run only event_registrations age fix
 *   node migrate.js events        — run only events status fix
 *   node migrate.js newsletter    — run only newsletter dedup
 *
 * IDEMPOTENT — safe to re-run; already-correct documents are skipped.
 */

'use strict';

const admin = require('firebase-admin');
const path  = require('path');
const fs    = require('fs');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY    = args.filter(a => !a.startsWith('--'));

// ─── Firebase init ────────────────────────────────────────────────────────────
const keyPath = path.resolve(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('\n❌  scripts/serviceAccountKey.json not found.');
  console.error('   Download from Firebase Console → Project Settings → Service Accounts\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(keyPath)),
  projectId:  'trust-website-5a814',
});

const db = admin.firestore();

// ─── Counters ─────────────────────────────────────────────────────────────────
let totalFixed = 0, totalSkipped = 0, totalDeleted = 0, totalErrors = 0;

function log(symbol, msg) { console.log(`  ${symbol}  ${msg}`); }

// ─── [1] Fix causes: image→imageUrl, raised→raisedAmount, goal→goalAmount ─────
async function migrateCauses() {
  console.log('\n📂  [1] Migrating causes collection…');
  const snap = await db.collection('causes').get();

  if (snap.empty) {
    log('ℹ️', 'No documents in causes — nothing to do.');
    return;
  }

  for (const docSnap of snap.docs) {
    const data = docSnap.data();

    const needsFix = 'image' in data || 'raised' in data || 'goal' in data;
    if (!needsFix) {
      log('⏭', `${docSnap.id} — already correct`);
      totalSkipped++;
      continue;
    }

    const updates = {};
    const deletes = {};

    if ('image' in data) {
      updates.imageUrl = data.image;
      deletes.image    = admin.firestore.FieldValue.delete();
      log('🔄', `${docSnap.id}  image → imageUrl  ("${String(data.image).slice(0, 60)}")`);
    }
    if ('raised' in data) {
      updates.raisedAmount = data.raised;
      deletes.raised       = admin.firestore.FieldValue.delete();
      log('🔄', `${docSnap.id}  raised → raisedAmount  (${data.raised})`);
    }
    if ('goal' in data) {
      updates.goalAmount = data.goal;
      deletes.goal       = admin.firestore.FieldValue.delete();
      log('🔄', `${docSnap.id}  goal → goalAmount  (${data.goal})`);
    }

    if (!DRY_RUN) {
      try {
        await docSnap.ref.update({ ...updates, ...deletes, migratedAt: admin.firestore.FieldValue.serverTimestamp() });
        log('✅', `${docSnap.id} — fixed`);
      } catch (err) {
        log('❌', `${docSnap.id} — ERROR: ${err.message}`);
        totalErrors++;
        continue;
      }
    } else {
      log('🔍', `[DRY] would update ${docSnap.id}`);
    }
    totalFixed++;
  }
}

// ─── [2] Fix event_registrations: age string → number ─────────────────────────
async function migrateEventRegAges() {
  console.log('\n📂  [2] Migrating event_registrations.age (string → number)…');
  const snap = await db.collection('event_registrations').get();

  if (snap.empty) {
    log('ℹ️', 'No event registrations — nothing to do.');
    return;
  }

  for (const docSnap of snap.docs) {
    const { age } = docSnap.data();

    if (age === null || age === undefined || age === '') {
      log('⏭', `${docSnap.id} — age is empty, skipping`);
      totalSkipped++;
      continue;
    }

    if (typeof age === 'number') {
      log('⏭', `${docSnap.id} — age already a number (${age})`);
      totalSkipped++;
      continue;
    }

    const numAge = Number(age);
    if (isNaN(numAge) || numAge < 1 || numAge > 120) {
      log('⚠️', `${docSnap.id} — age "${age}" cannot convert to valid number, skipping`);
      totalSkipped++;
      continue;
    }

    log('🔄', `${docSnap.id}  age  "${age}" (string) → ${numAge} (number)`);

    if (!DRY_RUN) {
      try {
        await docSnap.ref.update({ age: numAge, migratedAt: admin.firestore.FieldValue.serverTimestamp() });
        log('✅', `${docSnap.id} — fixed`);
      } catch (err) {
        log('❌', `${docSnap.id} — ERROR: ${err.message}`);
        totalErrors++;
        continue;
      }
    } else {
      log('🔍', `[DRY] would update ${docSnap.id}`);
    }
    totalFixed++;
  }
}

// ─── [3] Fix events: add status:'upcoming' where missing ──────────────────────
async function migrateEventStatus() {
  console.log('\n📂  [3] Migrating events — adding missing status field…');
  const snap = await db.collection('events').get();

  if (snap.empty) {
    log('ℹ️', 'No events — nothing to do.');
    return;
  }

  for (const docSnap of snap.docs) {
    const { status } = docSnap.data();

    if (status) {
      log('⏭', `${docSnap.id} — status already set ("${status}")`);
      totalSkipped++;
      continue;
    }

    log('🔄', `${docSnap.id}  adding status: 'upcoming'`);

    if (!DRY_RUN) {
      try {
        await docSnap.ref.update({
          status:      'upcoming',
          featured:    false,
          migratedAt:  admin.firestore.FieldValue.serverTimestamp(),
        });
        log('✅', `${docSnap.id} — fixed`);
      } catch (err) {
        log('❌', `${docSnap.id} — ERROR: ${err.message}`);
        totalErrors++;
        continue;
      }
    } else {
      log('🔍', `[DRY] would update ${docSnap.id}`);
    }
    totalFixed++;
  }
}

// ─── [4] Newsletter deduplication ─────────────────────────────────────────────
async function migrateNewsletterDedup() {
  console.log('\n📂  [4] Deduplicating newsletter collection…');
  const snap = await db.collection('newsletter').get();

  if (snap.empty) {
    log('ℹ️', 'No newsletter subscribers — nothing to do.');
    return;
  }

  // Group by normalised email → keep the one with earliest subscribedAt
  const byEmail = new Map();
  for (const docSnap of snap.docs) {
    const { email, subscribedAt } = docSnap.data();
    if (!email) continue;

    const normEmail = email.toLowerCase().trim();
    const existing  = byEmail.get(normEmail);

    if (!existing) {
      byEmail.set(normEmail, docSnap);
    } else {
      // Keep the one with the earlier subscribedAt (prefer oldest subscription)
      const existSeconds = existing.data().subscribedAt?.seconds ?? Infinity;
      const thisSeconds  = subscribedAt?.seconds ?? Infinity;
      if (thisSeconds < existSeconds) {
        // This doc is older — it should be the keeper; existing is the duplicate
        byEmail.set(normEmail, docSnap);            // new keeper
        // The old "existing" becomes a duplicate — push to delete list
        byEmail.set(normEmail + '__del__' + existing.id, existing);
      } else {
        // Current doc is newer — mark it for deletion
        byEmail.set(normEmail + '__del__' + docSnap.id, docSnap);
      }
    }
  }

  // Separate keepers from duplicates
  const toDelete = [];
  for (const [key, docSnap] of byEmail.entries()) {
    if (key.includes('__del__')) {
      toDelete.push(docSnap);
    }
  }

  if (toDelete.length === 0) {
    log('✅', 'No duplicate emails found.');
    return;
  }

  log('⚠️', `Found ${toDelete.length} duplicate(s) to remove:`);
  for (const docSnap of toDelete) {
    const { email, subscribedAt } = docSnap.data();
    const date = subscribedAt?.toDate?.()?.toLocaleDateString('en-IN') ?? 'unknown date';
    log('🗑️', `${docSnap.id}  email="${email}"  subscribed=${date}`);

    if (!DRY_RUN) {
      try {
        await docSnap.ref.delete();
        log('✅', `${docSnap.id} — deleted`);
        totalDeleted++;
      } catch (err) {
        log('❌', `${docSnap.id} — ERROR: ${err.message}`);
        totalErrors++;
      }
    } else {
      log('🔍', `[DRY] would delete ${docSnap.id}`);
      totalDeleted++;
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) console.log('\n🔍  DRY-RUN mode — Firestore will NOT be modified.\n');
  console.log('🚀  OAIT Firestore Migration — project: trust-website-5a814');

  const runAll = ONLY.length === 0;

  if (runAll || ONLY.includes('causes'))      await migrateCauses();
  if (runAll || ONLY.includes('ages'))        await migrateEventRegAges();
  if (runAll || ONLY.includes('events'))      await migrateEventStatus();
  if (runAll || ONLY.includes('newsletter'))  await migrateNewsletterDedup();

  console.log('\n─────────────────────────────────────────────');
  console.log(`📊  Summary:`);
  console.log(`    Fixed   : ${totalFixed}`);
  console.log(`    Deleted : ${totalDeleted}`);
  console.log(`    Skipped : ${totalSkipped}`);
  console.log(`    Errors  : ${totalErrors}`);
  if (DRY_RUN) console.log('\n    ↳ Dry run — run without --dry-run to apply changes.');
  console.log('─────────────────────────────────────────────\n');

  if (totalErrors > 0) process.exit(1);
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌  Migration failed:', err.message);
  process.exit(1);
});
