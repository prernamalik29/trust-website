# Firestore Migration & Schema Guide
**Olympian Anuj International Trust — trust-website-5a814**

---

## Quick-start checklist

Before doing anything, get a Firebase service-account key:

1. [Firebase Console](https://console.firebase.google.com) → select **trust-website-5a814**
2. ⚙️ Project Settings → **Service accounts** tab
3. Click **Generate new private key** → download → save as `scripts/serviceAccountKey.json`
4. **Never commit this file** (it is already in `.gitignore`)

```
scripts/
  serviceAccountKey.json   ← downloaded here, gitignored
  seed.js
  migrate.js
  package.json
```

Install dependencies once:
```bash
cd scripts
npm install
```

---

## Step 1 — Deploy Firestore Security Rules

The file `firestore.rules` defines who can read and write each collection.
Deploy it before any data exists to protect the database from day one.

```bash
# Install Firebase CLI (once)
npm install -g firebase-tools

# Log in
firebase login

# Set active project
firebase use trust-website-5a814

# Deploy rules and indexes from the repo root
firebase deploy --only firestore:rules,firestore:indexes
```

Expected output:
```
✔  firestore: released rules firestore.rules to cloud.firestore
✔  firestore: released indexes firestore.indexes.json to cloud.firestore
```

**What the rules enforce:**

| Collection | Public (unauthenticated) | Admin (Firebase Auth user) |
|---|---|---|
| `causes` | ✅ read | ✅ full CRUD |
| `events` | ✅ read | ✅ full CRUD |
| `blog` | ✅ read | ✅ full CRUD |
| `testimonials` | ✅ read | ✅ full CRUD |
| `stats` | ✅ read | ✅ full CRUD |
| `contacts` | ✅ create only | ✅ read / update / delete |
| `volunteers` | ✅ create only | ✅ read / update / delete |
| `donations` | ✅ create only | ✅ read / update / delete |
| `newsletter` | ✅ create only | ✅ read / update / delete |
| `event_registrations` | ✅ create only | ✅ read / update / delete |

---

## Step 2 — Seed initial content

Run once to populate events, homepage stats and sample causes.
The seeder is **idempotent** — already-existing documents are skipped.

```bash
cd scripts

# Preview what will be created (safe, no writes)
node seed.js --dry-run

# Seed everything
node seed.js

# Seed only one collection
node seed.js events
node seed.js stats
node seed.js causes
```

**What gets seeded:**

| Collection | Records | Source |
|---|---|---|
| `events` | 3 | `data/events/*.json` (read automatically) |
| `stats/siteStats` | 1 document | hardcoded in `STATS_DATA` in seed.js |
| `causes` | 3 | hardcoded in `CAUSES_DATA` in seed.js |

After seeding, update `CAUSES_DATA` in `scripts/seed.js` with real data before running, or
create causes directly through the admin panel at `/admin/causes`.

---

## Step 3 — Run data migration (if data already exists)

> **Skip this step if you are setting up a brand-new Firestore database.**
> Run it only if documents were written by old/broken code.

The migration script fixes four known data issues:

| Fix | Collection | Problem | Correction |
|---|---|---|---|
| 1 | `causes` | Old seed wrote `image`, `raised`, `goal` | Renames to `imageUrl`, `raisedAmount`, `goalAmount` |
| 2 | `event_registrations` | `age` was stored as a string | Converts to a number |
| 3 | `events` | Admin-created docs missing `status` field | Adds `status: 'upcoming'` |
| 4 | `newsletter` | Same email submitted multiple times | Keeps earliest subscription, deletes duplicates |

```bash
cd scripts

# Preview all migrations without making any changes
node migrate.js --dry-run

# Apply all migrations
node migrate.js

# Apply individual migrations
node migrate.js causes
node migrate.js ages
node migrate.js events
node migrate.js newsletter
```

Example output:
```
🚀  OAIT Firestore Migration — project: trust-website-5a814

📂  [1] Migrating causes collection…
  🔄  abc123  image → imageUrl ("https://images.unsplash.com/...")
  🔄  abc123  raised → raisedAmount (850000)
  🔄  abc123  goal → goalAmount (1500000)
  ✅  abc123 — fixed

📊  Summary:
    Fixed   : 3
    Deleted : 0
    Skipped : 0
    Errors  : 0
```

---

## Step 4 — Create the admin user

The admin panel (`/admin/`) requires a Firebase Auth account.

1. [Firebase Console](https://console.firebase.google.com) → **Authentication** → **Users**
2. Click **Add user**
3. Enter an email and a strong password
4. Click **Add user**

> ⚠️ Any Firebase Auth user has full admin access. Keep the number of accounts minimal and use strong passwords.

---

## Step 5 — Set Netlify environment variables (for CI builds)

Because `admin/.env` is gitignored, Netlify's build environment needs
these variables set in the dashboard:

1. Netlify dashboard → your site → **Site configuration** → **Environment variables**
2. Add the following variables:

| Key | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyC-G2kBTJNlnfblwaFiEItDOhZ1Hwivpbg` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `trust-website-5a814.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `trust-website-5a814` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `trust-website-5a814.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `925990180836` |
| `VITE_FIREBASE_APP_ID` | `1:925990180836:web:361209601e5077d2efd9f1` |
| `VITE_CLOUDINARY_CLOUD_NAME` | `dplbix7pz` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `trust-website` |

> The admin React app already includes fallback hardcoded values, so this step
> is a best-practice precaution for clarity in builds.

---

## Step 6 — Post-migration verification

After running the migration, verify the data in the Firebase Console:

### Verify causes
Go to Firestore → `causes` collection → open any document.
Each document must have exactly these fields (not `image`, `raised`, `goal`):
```
title          (string)
description    (string)
imageUrl       (string)
raisedAmount   (number)
goalAmount     (number)
category       (string)
status         (string)   "active"
createdAt      (timestamp)
```

### Verify events
Go to Firestore → `events` collection → open any document.
```
title          (string)
imageUrl       (string)
day            (string)   e.g. "08"
month          (string)   e.g. "Mar"
year           (string)   e.g. "2026"
time           (string)
location       (string)
category       (string)
description    (string)
status         (string)   "upcoming"  ← must be present
createdAt      (timestamp)
```

### Verify stats
Go to Firestore → `stats` → `siteStats`.
```
totalDonations    (number)
volunteers        (number)
eventsOrganized   (number)
childrenSupported (number)
createdAt         (timestamp)
```

### Verify public website renders correctly
- Homepage (`/`) should show events, causes with progress bars, testimonials
- Causes page (`/causes.html`) should show cause cards with images, amounts, progress bars
- Newsletter footer form should not create duplicate entries
- Events page Register Now buttons should open the modal and populate event name

---

## Complete schema reference

### Submission collections (public write, admin read)

#### `contacts`
| Field | Type | Required | Written by |
|---|---|---|---|
| `firstName` | string | yes | contact.html form |
| `lastName` | string | yes | contact.html form |
| `email` | string | yes | contact.html form |
| `phone` | string | — | contact.html form |
| `subject` | string | yes | contact.html form — values: `general`, `donation`, `volunteer`, `partnership`, `sports`, `healthcare`, `food`, `other` |
| `message` | string | yes | contact.html form |
| `newsletter` | boolean | — | contact.html checkbox |
| `status` | string | auto | set to `'unread'` on create |
| `createdAt` | timestamp | auto | serverTimestamp() |

Status lifecycle: `unread` → `read` → `resolved`

---

#### `volunteers`
Populated automatically when a contact form is submitted with **subject = `volunteer`**.

| Field | Type | Required | Written by |
|---|---|---|---|
| `name` | string | yes | `firstName + ' ' + lastName` from contact form |
| `email` | string | yes | contact form |
| `phone` | string | — | contact form |
| `interestArea` | string | — | hardcoded `'General'` (no separate volunteer form yet) |
| `availability` | string | — | hardcoded `''` |
| `experience` | string | — | hardcoded `''` |
| `message` | string | yes | contact form message |
| `status` | string | auto | `'new'` |
| `createdAt` | timestamp | auto | serverTimestamp() |

Status lifecycle: `new` → `contacted` → `active`

> **Note:** A dedicated volunteer form with `interestArea`, `availability`, and `experience`
> fields would improve data quality. Until then, admin can edit these fields directly in
> the Firestore console or through a future admin "Add Volunteer" form.

---

#### `donations`
| Field | Type | Required | Written by |
|---|---|---|---|
| `donorName` | string | — | donate.html form |
| `donorEmail` | string | yes | donate.html form |
| `donorPhone` | string | — | donate.html form |
| `donorPAN` | string | — | donate.html form (80G certificate) |
| `donorAddress` | string | — | donate.html form |
| `anonymous` | boolean | — | donate.html checkbox |
| `amount` | number | yes | preset buttons or custom input (min ₹100) |
| `cause` | string | — | radio: `general`, `sports`, `healthcare`, `food` |
| `donationType` | string | — | radio: `onetime`, `monthly` |
| `status` | string | auto | `'pending'` |
| `createdAt` | timestamp | auto | serverTimestamp() |

Status lifecycle: `pending` → `confirmed` / `rejected`

---

#### `newsletter`
| Field | Type | Required | Written by |
|---|---|---|---|
| `email` | string | yes | footer form (all pages) or contact checkbox |
| `active` | boolean | auto | `true` on create; toggleable by admin |
| `subscribedAt` | timestamp | auto | serverTimestamp() |

Deduplication: forms.js checks `where('email', '==', email)` before inserting — duplicate submissions get a friendly "already subscribed" response.

Admin toggle: admin panel can click **Unsubscribe** / **Re-activate** per row.

---

#### `event_registrations`
| Field | Type | Required | Written by |
|---|---|---|---|
| `participantName` | string | yes | events.html modal form |
| `email` | string | yes | events.html modal form |
| `phone` | string | yes | events.html modal form |
| `age` | number | — | events.html modal form (stored as number) |
| `gender` | string | — | select: `Male`, `Female`, `Other`, `Prefer not to say` |
| `address` | string | — | events.html modal form |
| `eventName` | string | — | auto-filled from card DOM by JS bridge |
| `eventCategory` | string | — | auto-filled from card DOM by JS bridge |
| `eventDate` | string | — | auto-filled from card DOM by JS bridge |
| `tshirtSize` | string | — | select: `XS`, `S`, `M`, `L`, `XL`, `XXL` |
| `emergencyContact` | string | — | events.html modal form |
| `emergencyPhone` | string | — | events.html modal form |
| `medicalConditions` | string | — | events.html modal form textarea |
| `status` | string | auto | `'pending'` |
| `createdAt` | timestamp | auto | serverTimestamp() |

Status lifecycle: `pending` → `confirmed` / `cancelled`

---

### Content collections (admin managed, public readable)

#### `events`
| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `imageUrl` | string | Firebase Storage URL or external URL |
| `day` | string | e.g. `"08"` |
| `month` | string | e.g. `"Mar"` |
| `year` | string | e.g. `"2026"` |
| `time` | string | e.g. `"9:00 AM - 6:00 PM"` |
| `location` | string | |
| `category` | string | e.g. `Sports`, `Health`, `Community` |
| `description` | string | |
| `status` | string | `"upcoming"`, `"past"` — added by migration if missing |
| `featured` | boolean | `false` by default |
| `createdAt` | timestamp | set on create |
| `updatedAt` | timestamp | set on update |

---

#### `causes`
| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `imageUrl` | string | **Use `imageUrl`** — not `image` |
| `description` | string | |
| `raisedAmount` | number | **Use `raisedAmount`** — not `raised` |
| `goalAmount` | number | **Use `goalAmount`** — not `goal` |
| `category` | string | e.g. `sports`, `health`, `education` |
| `status` | string | `"active"`, `"completed"` |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

---

#### `blog`
| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `imageUrl` | string | |
| `date` | string | `YYYY-MM-DD` from `<input type="date">` |
| `author` | string | defaults to `'Admin'` |
| `commentsCount` | number | manual, defaults to 0 |
| `description` | string | summary snippet (no full body field) |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

---

#### `testimonials`
| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `role` | string | e.g. "Volunteer", "Donor" |
| `imageUrl` | string | |
| `quote` | string | shown in quotes on homepage |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

---

#### `stats/siteStats` (single document)
| Field | Type | Notes |
|---|---|---|
| `totalDonations` | number | ₹ amount shown on homepage |
| `volunteers` | number | |
| `eventsOrganized` | number | |
| `childrenSupported` | number | |
| `updatedAt` | timestamp | set when admin edits in Dashboard |

---

## Known limitations & future improvements

| # | Item | Impact | Suggested fix |
|---|---|---|---|
| 1 | No dedicated volunteer form | Volunteers arrive only via contact form; interest area and availability are always blank | Add a `/volunteer.html` page with a dedicated form |
| 2 | Blog has no full article body | "Read More" links go nowhere | Add a `content` rich-text field and individual post pages |
| 3 | No admin role system | Any Firebase Auth user is a full admin | Add Firestore `admin_users` collection with custom claims check in security rules |
| 4 | Events admin form doesn't write a Timestamp `date` | Can't do server-side date ordering | Update Events.jsx form to derive a proper Timestamp from `day`/`month`/`year` fields |
| 5 | Donation payment is form-only | No payment gateway — donations are manually confirmed | Integrate Razorpay or similar; write `paymentId` to the donation doc on success |

---

## Files changed by code audit fixes

| File | What changed |
|---|---|
| `scripts/seed.js` | causes fields: `image→imageUrl`, `raised→raisedAmount`, `goal→goalAmount` |
| `js/forms.js` | Added newsletter deduplication (both paths); `age` stored as number |
| `js/dynamic-content.js` | `renderCauses()` now replaces container instead of appending |
| `admin/src/services/db.js` | Added `toggleNewsletterActive()` |
| `admin/src/pages/Newsletter.jsx` | Added Unsubscribe / Re-activate toggle button per row + Unsubscribed stat chip |
| `admin/src/pages/EventRegistrations.jsx` | Added `address` and `emergencyPhone` to PDF/Word export columns |
