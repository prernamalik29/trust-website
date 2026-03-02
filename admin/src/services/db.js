import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  getCountFromServer,
} from 'firebase/firestore';

// ============ CAUSES ============
const causesRef = collection(db, 'causes');

export async function getCauses() {
  const snapshot = await getDocs(causesRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addCause(data) {
  return addDoc(causesRef, { ...data, createdAt: serverTimestamp() });
}

export async function updateCause(id, data) {
  return updateDoc(doc(db, 'causes', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCause(id) {
  return deleteDoc(doc(db, 'causes', id));
}

// ============ EVENTS ============
const eventsRef = collection(db, 'events');

export async function getEvents() {
  const snapshot = await getDocs(eventsRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addEvent(data) {
  return addDoc(eventsRef, { ...data, createdAt: serverTimestamp() });
}

export async function updateEvent(id, data) {
  return updateDoc(doc(db, 'events', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteEvent(id) {
  return deleteDoc(doc(db, 'events', id));
}

// ============ TESTIMONIALS ============
const testimonialsRef = collection(db, 'testimonials');

export async function getTestimonials() {
  const snapshot = await getDocs(testimonialsRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addTestimonial(data) {
  return addDoc(testimonialsRef, { ...data, createdAt: serverTimestamp() });
}

export async function updateTestimonial(id, data) {
  return updateDoc(doc(db, 'testimonials', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTestimonial(id) {
  return deleteDoc(doc(db, 'testimonials', id));
}

// ============ BLOG ============
const blogRef = collection(db, 'blog');

export async function getBlogPosts() {
  const snapshot = await getDocs(blogRef);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addBlogPost(data) {
  return addDoc(blogRef, { ...data, createdAt: serverTimestamp() });
}

export async function updateBlogPost(id, data) {
  return updateDoc(doc(db, 'blog', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteBlogPost(id) {
  return deleteDoc(doc(db, 'blog', id));
}

// ============ STATS (single document) ============
const STATS_DOC_ID = 'siteStats';

export async function getStats() {
  const docSnap = await getDoc(doc(db, 'stats', STATS_DOC_ID));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function updateStats(data) {
  const statsDocRef = doc(db, 'stats', STATS_DOC_ID);
  const docSnap = await getDoc(statsDocRef);
  if (docSnap.exists()) {
    return updateDoc(statsDocRef, { ...data, updatedAt: serverTimestamp() });
  }
  return setDoc(statsDocRef, { ...data, createdAt: serverTimestamp() });
}

// ============ CONTACTS ============
const contactsRef = collection(db, 'contacts');

export async function getContacts() {
  try {
    const q = query(contactsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const snapshot = await getDocs(contactsRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

export async function updateContactStatus(id, status) {
  return updateDoc(doc(db, 'contacts', id), { status, updatedAt: serverTimestamp() });
}

export async function deleteContact(id) {
  return deleteDoc(doc(db, 'contacts', id));
}

export async function getUnreadContactsCount() {
  try {
    const q = query(contactsRef, where('status', '==', 'unread'));
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch {
    return 0;
  }
}

// ============ VOLUNTEERS ============
const volunteersRef = collection(db, 'volunteers');

export async function getVolunteers() {
  try {
    const q = query(volunteersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const snapshot = await getDocs(volunteersRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

export async function updateVolunteerStatus(id, status) {
  return updateDoc(doc(db, 'volunteers', id), { status, updatedAt: serverTimestamp() });
}

export async function deleteVolunteer(id) {
  return deleteDoc(doc(db, 'volunteers', id));
}

export async function getNewVolunteersCount() {
  try {
    const q = query(volunteersRef, where('status', '==', 'new'));
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch {
    return 0;
  }
}

// ============ DONATIONS ============
const donationsRef = collection(db, 'donations');

export async function getDonations() {
  try {
    const q = query(donationsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const snapshot = await getDocs(donationsRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

export async function updateDonationStatus(id, status) {
  return updateDoc(doc(db, 'donations', id), { status, updatedAt: serverTimestamp() });
}

export async function deleteDonation(id) {
  return deleteDoc(doc(db, 'donations', id));
}

export async function getPendingDonationsCount() {
  try {
    const q = query(donationsRef, where('status', '==', 'pending'));
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch {
    return 0;
  }
}

// ============ NEWSLETTER ============
const newsletterRef = collection(db, 'newsletter');

export async function getNewsletterSubscribers() {
  try {
    const q = query(newsletterRef, orderBy('subscribedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const snapshot = await getDocs(newsletterRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

export async function deleteNewsletterSubscriber(id) {
  return deleteDoc(doc(db, 'newsletter', id));
}

export async function getActiveSubscribersCount() {
  try {
    const q = query(newsletterRef, where('active', '==', true));
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch {
    return 0;
  }
}

// ============ EVENT REGISTRATIONS ============
const eventRegsRef = collection(db, 'event_registrations');

export async function getEventRegistrations() {
  try {
    const q = query(eventRegsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const snapshot = await getDocs(eventRegsRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

export async function updateEventRegStatus(id, status) {
  return updateDoc(doc(db, 'event_registrations', id), { status, updatedAt: serverTimestamp() });
}

export async function deleteEventRegistration(id) {
  return deleteDoc(doc(db, 'event_registrations', id));
}

export async function getPendingEventRegsCount() {
  try {
    const q = query(eventRegsRef, where('status', '==', 'pending'));
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch {
    return 0;
  }
}
