/**
 * Firebase Configuration for Public Website
 * This connects the website to Firebase for dynamic content
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore, collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyC-G2kBTJNlnfblwaFiEItDOhZ1Hwivpbg",
  authDomain: "trust-website-5a814.firebaseapp.com",
  projectId: "trust-website-5a814",
  storageBucket: "trust-website-5a814.firebasestorage.app",
  messagingSenderId: "925990180836",
  appId: "1:925990180836:web:361209601e5077d2efd9f1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============ DATA FETCHING FUNCTIONS ============

// Get all causes
export async function getCauses() {
  try {
    const snapshot = await getDocs(collection(db, 'causes'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching causes:', error);
    return [];
  }
}

// Get all events
export async function getEvents() {
  try {
    const snapshot = await getDocs(collection(db, 'events'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

// Get all testimonials
export async function getTestimonials() {
  try {
    const snapshot = await getDocs(collection(db, 'testimonials'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

// Get all blog posts
export async function getBlogPosts() {
  try {
    const snapshot = await getDocs(collection(db, 'blog'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

// Get site stats
export async function getStats() {
  try {
    const docSnap = await getDoc(doc(db, 'stats', 'siteStats'));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

export { db };
