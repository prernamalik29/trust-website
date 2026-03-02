/**
 * forms.js — Public website form submission handlers
 * Writes contact, volunteer (mirrored from contact), donation, newsletter,
 * and event registration data into Firestore.
 *
 * Olympian Anuj International Trust
 */

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// ── Firebase init (reuse existing app if already initialised by firebase-config.js) ──
const firebaseConfig = {
  apiKey: "AIzaSyC-G2kBTJNlnfblwaFiEItDOhZ1Hwivpbg",
  authDomain: "trust-website-5a814.firebaseapp.com",
  projectId: "trust-website-5a814",
  storageBucket: "trust-website-5a814.firebasestorage.app",
  messagingSenderId: "925990180836",
  appId: "1:925990180836:web:361209601e5077d2efd9f1",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ─────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────

function showToast(message, type = 'success') {
  // Reuse any existing toast infrastructure or create a quick one
  const existing = document.getElementById('oait-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'oait-toast';
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    background:${type === 'success' ? '#27ae60' : '#e74c3c'};
    color:#fff; padding:14px 22px; border-radius:8px;
    font-family:'Poppins',sans-serif; font-size:14px; font-weight:500;
    box-shadow:0 4px 20px rgba(0,0,0,.2);
    animation:oait-toast-in 0.3s ease;
  `;

  // Add keyframes once
  if (!document.getElementById('oait-toast-style')) {
    const style = document.createElement('style');
    style.id = 'oait-toast-style';
    style.textContent = `
      @keyframes oait-toast-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      @keyframes oait-toast-out { from{opacity:1} to{opacity:0} }
    `;
    document.head.appendChild(style);
  }

  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'oait-toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}

function showFormSubmitting(btn, originalText, loading = true) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || originalText;
  }
}

// ─────────────────────────────────────────────
// 1. Contact Form  (#contactForm on contact.html)
// ─────────────────────────────────────────────

async function handleContactForm(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('[type="submit"]');

  const firstName = form.firstName.value.trim();
  const lastName  = form.lastName.value.trim();
  const email     = form.email.value.trim();
  const phone     = form.phone?.value.trim() || '';
  const subject   = form.subject.value;
  const message   = form.message.value.trim();
  const newsletter = form.newsletter?.checked || false;

  if (!firstName || !lastName || !email || !subject || !message) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  showFormSubmitting(btn, 'Send Message');
  try {
    const contactData = {
      firstName, lastName, email, phone, subject, message, newsletter,
      status: 'unread',
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'contacts'), contactData);

    // If subject is 'volunteer', mirror to the volunteers collection too
    if (subject === 'volunteer') {
      await addDoc(collection(db, 'volunteers'), {
        name: `${firstName} ${lastName}`,
        email, phone,
        interestArea: 'General',
        availability: '',
        experience: '',
        message,
        status: 'new',
        createdAt: serverTimestamp(),
      });
    }

    // If newsletter opted-in, add to newsletter collection
    if (newsletter) {
      await addDoc(collection(db, 'newsletter'), {
        email,
        active: true,
        subscribedAt: serverTimestamp(),
      });
    }

    form.reset();
    showToast('✅ Your message has been sent! We\'ll get back to you shortly.');
  } catch (err) {
    console.error('Contact form error:', err);
    showToast('Failed to send message. Please try again.', 'error');
  } finally {
    showFormSubmitting(btn, 'Send Message', false);
  }
}

// ─────────────────────────────────────────────
// 2. Donation Form  (#donationForm on donate.html)
// ─────────────────────────────────────────────

async function handleDonationForm(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('[type="submit"]');

  // Amount — check selected preset or custom input
  let amount = 0;
  const activePreset = document.querySelector('.donate-amount-btn.active, .amount-btn.active, [data-amount].active');
  const customInput  = document.getElementById('customAmount');
  if (activePreset) {
    amount = Number(activePreset.dataset.amount) || 0;
  } else if (customInput?.value) {
    amount = Number(customInput.value) || 0;
  }

  // Cause radio
  const causeEl = document.querySelector('input[name="cause"]:checked');
  const cause   = causeEl ? causeEl.value : 'general';

  // Donation type radio
  const typeEl       = document.querySelector('input[name="donationType"]:checked');
  const donationType = typeEl ? typeEl.value : 'onetime';

  const donorName    = form.donorName?.value.trim()    || document.getElementById('donorName')?.value.trim()    || '';
  const donorEmail   = form.donorEmail?.value.trim()   || document.getElementById('donorEmail')?.value.trim()   || '';
  const donorPhone   = form.donorPhone?.value.trim()   || document.getElementById('donorPhone')?.value.trim()   || '';
  const donorPAN     = form.donorPAN?.value.trim()     || document.getElementById('donorPAN')?.value.trim()     || '';
  const donorAddress = form.donorAddress?.value.trim() || document.getElementById('donorAddress')?.value.trim() || '';
  const anonymous    = form.anonymous?.checked || document.getElementById('anonymous')?.checked || false;

  if (!donorEmail || amount < 100) {
    showToast('Please enter a valid email and donation amount (min ₹100).', 'error');
    return;
  }

  showFormSubmitting(btn, 'Donate Now');
  try {
    await addDoc(collection(db, 'donations'), {
      donorName, donorEmail, donorPhone, donorPAN, donorAddress,
      anonymous, amount, cause, donationType,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    form.reset();
    // Reset any active preset buttons
    document.querySelectorAll('[data-amount]').forEach((b) => b.classList.remove('active'));
    if (customInput) customInput.value = '';

    showToast(`✅ Thank you for your ₹${amount.toLocaleString('en-IN')} donation! We'll confirm shortly.`);
  } catch (err) {
    console.error('Donation form error:', err);
    showToast('Submission failed. Please try again.', 'error');
  } finally {
    showFormSubmitting(btn, 'Donate Now', false);
  }
}

// ─────────────────────────────────────────────
// 3. Newsletter footer form (any .newsletter-form)
// ─────────────────────────────────────────────

async function handleNewsletterForm(e) {
  e.preventDefault();
  const form  = e.target;
  const input = form.querySelector('input[type="email"]');
  const email = input?.value.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }

  try {
    await addDoc(collection(db, 'newsletter'), {
      email,
      active: true,
      subscribedAt: serverTimestamp(),
    });
    input.value = '';
    showToast('✅ You\'ve successfully subscribed to our newsletter!');
  } catch (err) {
    console.error('Newsletter error:', err);
    showToast('Subscription failed. Please try again.', 'error');
  }
}

// ─────────────────────────────────────────────
// 4. Event Registration Form  (#eventRegForm)
// ─────────────────────────────────────────────

async function handleEventRegistrationForm(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('[type="submit"]');

  const participantName    = form.participantName.value.trim();
  const email              = form.email.value.trim();
  const phone              = form.phone.value.trim();
  const age                = form.age?.value.trim() || '';
  const gender             = form.gender?.value || '';
  const address            = form.address?.value.trim() || '';
  const eventName          = form.eventName?.value || form.dataset.eventName || '';
  const eventCategory      = form.eventCategory?.value || form.dataset.eventCategory || '';
  const eventDate          = form.eventDate?.value || form.dataset.eventDate || '';
  const tshirtSize         = form.tshirtSize?.value || '';
  const emergencyContact   = form.emergencyContact?.value.trim() || '';
  const emergencyPhone     = form.emergencyPhone?.value.trim() || '';
  const medicalConditions  = form.medicalConditions?.value.trim() || '';

  if (!participantName || !email || !phone) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  showFormSubmitting(btn, 'Register Now');
  try {
    await addDoc(collection(db, 'event_registrations'), {
      participantName, email, phone, age, gender, address,
      eventName, eventCategory, eventDate,
      tshirtSize, emergencyContact, emergencyPhone, medicalConditions,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    form.reset();

    // Close modal if one is open
    const modal = document.getElementById('eventRegModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }

    showToast('✅ Registration successful! We\'ll confirm your spot soon.');
  } catch (err) {
    console.error('Event registration error:', err);
    showToast('Registration failed. Please try again.', 'error');
  } finally {
    showFormSubmitting(btn, 'Register Now', false);
  }
}

// ─────────────────────────────────────────────
// Boot — attach listeners on DOMContentLoaded
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Contact form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) contactForm.addEventListener('submit', handleContactForm);

  // Donation form
  const donationForm = document.getElementById('donationForm');
  if (donationForm) donationForm.addEventListener('submit', handleDonationForm);

  // Newsletter forms (could be multiple on the page)
  document.querySelectorAll('.newsletter-form').forEach((f) => {
    f.addEventListener('submit', handleNewsletterForm);
  });

  // Event registration form
  const eventRegForm = document.getElementById('eventRegForm');
  if (eventRegForm) eventRegForm.addEventListener('submit', handleEventRegistrationForm);
});

// Export for dynamic use if needed
export { handleEventRegistrationForm };
