import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getStats, updateStats,
  getCauses, getEvents, getTestimonials, getBlogPosts,
  getUnreadContactsCount, getNewVolunteersCount,
  getPendingDonationsCount, getActiveSubscribersCount, getPendingEventRegsCount,
} from '../services/db';
import './Dashboard.css';

const statFields = [
  { key: 'totalDonations', label: 'Total Donations (₹)', icon: 'fas fa-donate', color: '#27ae60' },
  { key: 'volunteers', label: 'Volunteers', icon: 'fas fa-hands-helping', color: '#2196f3' },
  { key: 'eventsOrganized', label: 'Events Organized', icon: 'fas fa-calendar-check', color: '#f9b000' },
  { key: 'childrenSupported', label: 'Children Supported', icon: 'fas fa-child', color: '#e74c3c' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [editStats, setEditStats] = useState(null);
  const [counts, setCounts] = useState({ causes: 0, events: 0, testimonials: 0, blog: 0 });
  const [submissionCounts, setSubmissionCounts] = useState({
    unreadContacts: 0, newVolunteers: 0, pendingDonations: 0, subscribers: 0, pendingEventRegs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsData, causes, events, testimonials, posts,
        unreadContacts, newVolunteers, pendingDonations, subscribers, pendingEventRegs
      ] = await Promise.all([
        getStats(),
        getCauses(),
        getEvents(),
        getTestimonials(),
        getBlogPosts(),
        getUnreadContactsCount(),
        getNewVolunteersCount(),
        getPendingDonationsCount(),
        getActiveSubscribersCount(),
        getPendingEventRegsCount(),
      ]);
      if (statsData) {
        setStats(statsData);
        setEditStats({ ...statsData });
      }
      setCounts({
        causes: causes.length,
        events: events.length,
        testimonials: testimonials.length,
        blog: posts.length,
      });
      setSubmissionCounts({ unreadContacts, newVolunteers, pendingDonations, subscribers, pendingEventRegs });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    }
    setLoading(false);
  }

  async function handleSaveStats() {
    setSaving(true);
    try {
      const data = {
        totalDonations: Number(editStats.totalDonations) || 0,
        volunteers: Number(editStats.volunteers) || 0,
        eventsOrganized: Number(editStats.eventsOrganized) || 0,
        childrenSupported: Number(editStats.childrenSupported) || 0,
      };
      await updateStats(data);
      setStats({ ...(stats || {}), ...data });
      setEditing(false);
    } catch (err) {
      alert('Failed to update stats');
      console.error(err);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="page-loading">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        {stats && (
          <button
            className={`btn ${editing ? 'btn-outline' : 'btn-primary'}`}
            onClick={() => {
              if (editing) {
                setEditStats({ ...stats });
              }
              setEditing(!editing);
            }}
          >
            <i className={`fas ${editing ? 'fa-times' : 'fa-edit'}`}></i>
            {editing ? 'Cancel' : 'Edit Stats'}
          </button>
        )}
      </div>

      {error && (
        <div className="page-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {!stats && !error && (
        <div className="page-info">
          <p>No stats document found. Click below to initialize with default values.</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              const defaults = { totalDonations: 0, volunteers: 0, eventsOrganized: 0, childrenSupported: 0 };
              setEditStats(defaults);
              setEditing(true);
            }}
          >
            Initialize Stats
          </button>
        </div>
      )}

      <div className="stats-grid">
        {statFields.map((field) => (
          <div key={field.key} className="stat-card-wrapper">
            {editing ? (
              <div className="stat-edit-card" style={{ borderTopColor: field.color }}>
                <label>{field.label}</label>
                <input
                  type="number"
                  value={editStats?.[field.key] ?? ''}
                  onChange={(e) =>
                    setEditStats({ ...editStats, [field.key]: e.target.value })
                  }
                />
              </div>
            ) : (
              <StatCard
                icon={field.icon}
                value={stats?.[field.key] ?? 0}
                label={field.label}
                color={field.color}
              />
            )}
          </div>
        ))}
      </div>

      {editing && (
        <div className="stats-save">
          <button className="btn btn-primary" onClick={handleSaveStats} disabled={saving}>
            {saving ? 'Saving...' : 'Save Stats'}
          </button>
        </div>
      )}

      <div className="collection-counts">
        <h2>Content Overview</h2>
        <div className="counts-grid">
          <div className="count-item">
            <i className="fas fa-hand-holding-heart"></i>
            <span className="count-num">{counts.causes}</span>
            <span className="count-label">Causes</span>
          </div>
          <div className="count-item">
            <i className="fas fa-calendar-alt"></i>
            <span className="count-num">{counts.events}</span>
            <span className="count-label">Events</span>
          </div>
          <div className="count-item">
            <i className="fas fa-quote-right"></i>
            <span className="count-num">{counts.testimonials}</span>
            <span className="count-label">Testimonials</span>
          </div>
          <div className="count-item">
            <i className="fas fa-blog"></i>
            <span className="count-num">{counts.blog}</span>
            <span className="count-label">Blog Posts</span>
          </div>
        </div>
      </div>

      <div className="collection-counts">
        <h2>Submissions Overview</h2>
        <div className="counts-grid">
          <div className="count-item" style={{ borderTop: '3px solid #e74c3c' }}>
            <i className="fas fa-envelope" style={{ color: '#e74c3c' }}></i>
            <span className="count-num">{submissionCounts.unreadContacts}</span>
            <span className="count-label">Unread Contacts</span>
          </div>
          <div className="count-item" style={{ borderTop: '3px solid #27ae60' }}>
            <i className="fas fa-hands-helping" style={{ color: '#27ae60' }}></i>
            <span className="count-num">{submissionCounts.newVolunteers}</span>
            <span className="count-label">New Volunteers</span>
          </div>
          <div className="count-item" style={{ borderTop: '3px solid #f9b000' }}>
            <i className="fas fa-calendar-check" style={{ color: '#f9b000' }}></i>
            <span className="count-num">{submissionCounts.pendingEventRegs}</span>
            <span className="count-label">Event Reg. Pending</span>
          </div>
          <div className="count-item" style={{ borderTop: '3px solid #2196f3' }}>
            <i className="fas fa-donate" style={{ color: '#2196f3' }}></i>
            <span className="count-num">{submissionCounts.pendingDonations}</span>
            <span className="count-label">Pending Donations</span>
          </div>
          <div className="count-item" style={{ borderTop: '3px solid #9c27b0' }}>
            <i className="fas fa-paper-plane" style={{ color: '#9c27b0' }}></i>
            <span className="count-num">{submissionCounts.subscribers}</span>
            <span className="count-label">Subscribers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
