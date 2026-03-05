/**
 * Dynamic Content Loader
 * Loads content from Firebase and injects it into the website
 */

import { getCauses, getEvents, getTestimonials, getBlogPosts, getStats } from './firebase-config.js';

// ============ UTILITY FUNCTIONS ============

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN').format(amount);
}

function calculateProgress(raised, goal) {
  if (!goal || goal === 0) return 0;
  return Math.min(Math.round((raised / goal) * 100), 100);
}

// ============ RENDER FUNCTIONS ============

// Render causes on index.html and causes.html
async function renderCauses() {
  const container = document.getElementById('causes-container');
  if (!container) return;

  try {
    const causes = await getCauses();
    
    if (causes.length === 0) {
      // Keep existing hardcoded causes if no dynamic ones exist
      return;
    }

    // Replace container contents with dynamic causes from Firestore
    const causesHtml = causes.map(cause => {
      const progress = calculateProgress(cause.raisedAmount, cause.goalAmount);
      return `
        <div class="cause-card reveal active">
          <div class="cause-image">
            <img src="${cause.imageUrl || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=500&q=80'}" alt="${cause.title}">
            <div class="cause-category">${cause.category || 'General'}</div>
          </div>
          <div class="cause-content">
            <h3 class="cause-title">${cause.title}</h3>
            <p class="cause-text">${cause.description || ''}</p>
            <div class="cause-progress">
              <div class="progress-info">
                <span>Raised: ₹${formatCurrency(cause.raisedAmount || 0)}</span>
                <span>Goal: ₹${formatCurrency(cause.goalAmount || 0)}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" data-progress="${progress}" style="width: ${progress}%"></div>
              </div>
            </div>
            <a href="donate.html" class="btn btn-outline">Donate Now</a>
          </div>
        </div>
      `;
    }).join('');
    container.innerHTML = causesHtml;
    // Signal script.js to re-animate progress bars for the new Firestore causes
    document.dispatchEvent(new CustomEvent('causesRendered'));
  } catch (error) {
    console.error('Error rendering causes:', error);
    container.innerHTML = '<p class="error">Failed to load causes. Please try again later.</p>';
  }
}

// Render events on index.html
async function renderEventsHome() {
  const container = document.getElementById('events-container');
  if (!container) return;

  try {
    const events = await getEvents();
    
    if (events.length === 0) {
      container.innerHTML = '<p class="no-data" style="text-align: center; grid-column: 1 / -1;">No upcoming events at the moment.</p>';
      return;
    }

    // Show only first 3 events on homepage
    const displayEvents = events.slice(0, 3);

    container.innerHTML = displayEvents.map(event => `
      <div class="event-card reveal active">
        <div class="event-image">
          <img src="${event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80'}" alt="${event.title}">
          <div class="event-date">
            <span class="day">${event.day || '01'}</span>
            <span class="month">${event.month || 'Jan'}</span>
          </div>
        </div>
        <div class="event-content">
          <div class="event-meta">
            <span><i class="fas fa-clock"></i> ${event.time || 'TBA'}</span>
            <span><i class="fas fa-map-marker-alt"></i> ${event.location || 'TBA'}</span>
          </div>
          <h3 class="event-title">${event.title}</h3>
          <p class="event-text">${event.description ? event.description.substring(0, 100) + '...' : ''}</p>
          <a href="events.html" class="btn btn-outline-sm">Learn More</a>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error rendering events:', error);
    container.innerHTML = '<p class="error">Failed to load events. Please try again later.</p>';
  }
}

// Render events on events.html (full page)
async function renderEventsPage() {
  const container = document.getElementById('events-page-container');
  if (!container) return;

  try {
    const events = await getEvents();
    
    if (events.length === 0) {
      container.innerHTML = '<p class="no-data">No events available at the moment.</p>';
      return;
    }

    // First event as featured
    const featuredEvent = events[0];
    const otherEvents = events.slice(1);

    let html = `
      <div class="event-featured reveal active">
        <div class="event-featured-image">
          <img src="${featuredEvent.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'}" alt="${featuredEvent.title}">
          <div class="event-date-large">
            <span class="day">${featuredEvent.day || '01'}</span>
            <span class="month">${featuredEvent.month || 'January'}</span>
            <span class="year">${featuredEvent.year || '2026'}</span>
          </div>
        </div>
        <div class="event-featured-content">
          <div class="event-category">${featuredEvent.category || 'Event'}</div>
          <h2>${featuredEvent.title}</h2>
          <p>${featuredEvent.description || ''}</p>
          
          <div class="event-details-grid">
            <div class="event-detail">
              <i class="fas fa-calendar-alt"></i>
              <div>
                <strong>Date</strong>
                <span>${featuredEvent.month || ''} ${featuredEvent.day || ''}, ${featuredEvent.year || '2026'}</span>
              </div>
            </div>
            <div class="event-detail">
              <i class="fas fa-clock"></i>
              <div>
                <strong>Time</strong>
                <span>${featuredEvent.time || 'TBA'}</span>
              </div>
            </div>
            <div class="event-detail">
              <i class="fas fa-map-marker-alt"></i>
              <div>
                <strong>Location</strong>
                <span>${featuredEvent.location || 'TBA'}</span>
              </div>
            </div>
          </div>
          
          <div class="event-buttons">
            <a href="#" class="btn btn-primary">Register Now</a>
            <a href="#" class="btn btn-outline">Learn More</a>
          </div>
        </div>
      </div>
    `;

    if (otherEvents.length > 0) {
      html += '<div class="events-grid">';
      html += otherEvents.map(event => `
        <div class="event-card reveal active">
          <div class="event-image">
            <img src="${event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80'}" alt="${event.title}">
            <div class="event-date">
              <span class="day">${event.day || '01'}</span>
              <span class="month">${event.month || 'Jan'}</span>
            </div>
          </div>
          <div class="event-content">
            <div class="event-meta">
              <span><i class="fas fa-clock"></i> ${event.time || 'TBA'}</span>
              <span><i class="fas fa-map-marker-alt"></i> ${event.location || 'TBA'}</span>
            </div>
            <h3 class="event-title">${event.title}</h3>
            <p class="event-text">${event.description ? event.description.substring(0, 100) + '...' : ''}</p>
            <a href="#" class="btn btn-outline-sm">Register</a>
          </div>
        </div>
      `).join('');
      html += '</div>';
    }

    container.innerHTML = html;
  } catch (error) {
    console.error('Error rendering events page:', error);
    container.innerHTML = '<p class="error">Failed to load events. Please try again later.</p>';
  }
}

// Render testimonials
async function renderTestimonials() {
  const container = document.getElementById('testimonialTrack');
  if (!container) return;

  try {
    const testimonials = await getTestimonials();
    
    if (testimonials.length === 0) {
      // Keep default testimonials if none in Firebase
      return;
    }

    container.innerHTML = testimonials.map(testimonial => `
      <div class="testimonial-card">
        <div class="testimonial-content">
          <div class="quote-icon"><i class="fas fa-quote-left"></i></div>
          <p class="testimonial-text">"${testimonial.quote}"</p>
        </div>
        <div class="testimonial-author">
          <div class="author-image">
            <img src="${testimonial.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'}" alt="${testimonial.name}">
          </div>
          <div class="author-info">
            <h4>${testimonial.name}</h4>
            <span>${testimonial.role}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Update slider navigation dots to match the new testimonial count
    const dotsContainer = document.getElementById('sliderDots');
    if (dotsContainer) {
      dotsContainer.innerHTML = testimonials.map((_, i) =>
        `<span class="dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`
      ).join('');
    }
    // Signal script.js to reinitialize the slider state
    document.dispatchEvent(new CustomEvent('testimonialsUpdated'));
  } catch (error) {
    console.error('Error rendering testimonials:', error);
  }
}

// Render blog posts
async function renderBlogPosts() {
  const container = document.getElementById('blog-posts-container');
  if (!container) return;

  try {
    const posts = await getBlogPosts();
    
    if (posts.length === 0) {
      // Keep default blog posts if none in Firebase
      return;
    }

    const postsHtml = posts.map(post => {
      const date = post.date ? new Date(post.date) : new Date();
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      return `
        <article class="blog-post-card reveal active">
          <div class="blog-post-image">
            <img src="${post.imageUrl || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80'}" alt="${post.title}">
            <div class="blog-post-date">
              <span class="day">${day}</span>
              <span class="month">${month}</span>
            </div>
          </div>
          <div class="blog-post-content">
            <div class="blog-post-meta">
              <span><i class="fas fa-user"></i> ${post.author || 'Admin'}</span>
              <span><i class="fas fa-comments"></i> ${post.commentsCount || 0} Comments</span>
            </div>
            <h2>${post.title}</h2>
            <p>${post.description || ''}</p>
            <a href="blog-post.html?id=${post.id}" class="btn btn-outline">Read More</a>
          </div>
        </article>
      `;
    }).join('');
    
    // Replace all existing content (hardcoded posts + pagination) with Firestore posts
    container.innerHTML = postsHtml;
  } catch (error) {
    console.error('Error rendering blog posts:', error);
  }
}

// Update statistics from Firebase
async function updateStats() {
  const statNumbers = document.querySelectorAll('.stat-number[data-stat-key]');
  if (statNumbers.length === 0) return;

  try {
    const stats = await getStats();
    if (!stats) return;

    statNumbers.forEach(el => {
      const key = el.getAttribute('data-stat-key');
      if (stats[key] !== undefined) {
        el.setAttribute('data-count', stats[key]);
      }
    });
    // Signal script.js to reset the animation flag and re-run the counter
    // with the Firestore values (overriding the hardcoded data-count defaults)
    document.dispatchEvent(new CustomEvent('statsUpdated'));
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

// ============ INITIALIZATION ============

// Auto-detect page and load appropriate content.
// IMPORTANT: Uses DOM element presence (not URL path) to decide what to render.
// Netlify and most hosts serve pretty URLs without the .html extension
// (e.g., /causes instead of /causes.html), so path.includes('causes.html')
// would NEVER match in production. Element-based detection is fully robust.
document.addEventListener('DOMContentLoaded', async function() {
  const renderJobs = [];

  if (document.getElementById('causes-container'))
    renderJobs.push(renderCauses());

  if (document.getElementById('events-page-container'))
    renderJobs.push(renderEventsPage());

  if (document.getElementById('events-container'))
    renderJobs.push(renderEventsHome());

  if (document.getElementById('blog-posts-container'))
    renderJobs.push(renderBlogPosts());

  if (document.getElementById('testimonialTrack'))
    renderJobs.push(renderTestimonials());

  if (document.querySelectorAll('.stat-number[data-stat-key]').length > 0)
    renderJobs.push(updateStats());

  await Promise.all(renderJobs);
});

// Export for manual use
export { renderCauses, renderEventsHome, renderEventsPage, renderTestimonials, renderBlogPosts, updateStats };
