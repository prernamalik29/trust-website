import { useState, useEffect } from 'react';
import { getCompletedEvents } from '../services/db';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Safely format a date value that may be a Firestore Timestamp,
 * a JS Date, an ISO string, or a plain year-string.
 */
function formatDate(dateVal) {
  if (!dateVal) return '';
  try {
    const d = typeof dateVal?.toDate === 'function' ? dateVal.toDate() : new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return String(dateVal);
  }
}

// ─── Skeleton card (shown while loading) ────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
      <div className="h-52 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-200 rounded-full w-1/3" />
        <div className="h-5 bg-gray-200 rounded-full w-3/4" />
        <div className="h-3 bg-gray-200 rounded-full w-full" />
        <div className="h-3 bg-gray-200 rounded-full w-5/6" />
      </div>
    </div>
  );
}

// ─── Individual event card ────────────────────────────────────────────────

function EventCard({ event }) {
  return (
    <article className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt={event.title}
          loading="lazy"
          className="h-52 w-full object-cover"
        />
      ) : (
        <div className="h-52 w-full flex items-center justify-center bg-gradient-to-br from-[#0f3d2e] to-[#f9b000]">
          <span className="text-white text-5xl select-none">🏆</span>
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {event.date && (
          <span className="text-xs font-semibold text-[#f9b000] uppercase tracking-widest mb-2 block">
            {formatDate(event.date)}
          </span>
        )}
        <h3 className="text-base font-bold text-gray-800 leading-snug mb-2">{event.title}</h3>
        {event.location && (
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {event.location}
          </p>
        )}
        <p className="text-sm text-gray-500 leading-relaxed flex-1 line-clamp-3">{event.description}</p>
      </div>
    </article>
  );
}

// ─── Main Gallery Component ──────────────────────────────────────────────────

export default function EventGallery() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCompletedEvents()
      .then(setEvents)
      .catch((err) => {
        console.error('EventGallery fetch error:', err);
        setError('Unable to load the gallery. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Branded top bar ── */}
      <header className="bg-[#0f3d2e] py-4 px-6 flex items-center gap-3 shadow-md">
        <img
          src="/assets/logo/OLYMPIAN_ANUJ_INTERNATIONAL_TRUST_-_Logo-without-background.png"
          alt="OAIT Logo"
          className="h-10 w-10 rounded-full object-cover bg-white p-0.5"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[#f9b000] text-xs font-semibold uppercase tracking-widest leading-tight truncate">
            Olympian Anuj International Trust
          </p>
          <p className="text-white text-sm leading-tight">Event Gallery</p>
        </div>
        <a
          href="/"
          className="text-gray-300 hover:text-white text-sm transition-colors whitespace-nowrap flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Website
        </a>
      </header>

      {/* ── Main content ── */}
      <main id="event-gallery" className="flex-1 max-w-6xl w-full mx-auto py-14 px-4">

        {/* Section title */}
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-[#f9b000] uppercase tracking-widest mb-2">
            Our Milestones
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Success Stories &amp; Event Gallery
          </h1>
          {/* Decorative rule in trust brand colours */}
          <div className="flex justify-center items-center gap-1 mb-4">
            <span className="h-1.5 w-14 rounded-full bg-[#f9b000] inline-block" />
            <span className="h-1.5 w-5 rounded-full bg-[#0f3d2e] inline-block" />
          </div>
          <p className="text-gray-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Relive the moments that made a difference — sporting events, health camps, community
            drives, and more organised by Olympian Anuj International Trust.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-8 text-center text-sm">
            {error}
          </div>
        )}

        {/* Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : events.map((ev) => <EventCard key={ev.id} event={ev} />)}
        </div>

        {/* Empty state */}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-5 select-none">🏅</div>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Gallery Coming Soon</h2>
            <p className="text-gray-400 text-sm">
              We&apos;re uploading memories from our past events. Please check back soon!
            </p>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0f3d2e] text-center py-5 text-gray-400 text-xs">
        © {new Date().getFullYear()} Olympian Anuj International Trust — Reg. No. 260
      </footer>
    </div>
  );
}
