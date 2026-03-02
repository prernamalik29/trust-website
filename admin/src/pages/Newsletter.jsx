import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { getNewsletterSubscribers, deleteNewsletterSubscriber, toggleNewsletterActive } from '../services/db';
import { exportToPDF, exportToWord } from '../services/exportService';
import './ContentPages.css';

const EXPORT_COLUMNS = [
  { key: 'email', label: 'Email' },
  { key: 'active', label: 'Active' },
  { key: 'subscribedAt', label: 'Subscribed On' },
];

function fmt(ts) {
  if (!ts) return '—';
  if (ts.toDate) return ts.toDate().toLocaleDateString('en-IN');
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('en-IN');
  return String(ts);
}

export default function Newsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  async function handleToggle(subscriber) {
    setTogglingId(subscriber.id);
    try {
      const newActive = subscriber.active === false;
      await toggleNewsletterActive(subscriber.id, newActive);
      setSubscribers((prev) =>
        prev.map((s) => s.id === subscriber.id ? { ...s, active: newActive } : s)
      );
    } catch {
      alert('Failed to update subscriber status');
    }
    setTogglingId(null);
  }

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const rows = await getNewsletterSubscribers();
      setSubscribers(rows);
    } catch (e) {
      setError('Failed to load subscribers');
      console.error(e);
    }
    setLoading(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteNewsletterSubscriber(deleteTarget.id);
      setSubscribers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert('Failed to delete subscriber');
    }
    setDeleting(false);
  }

  const activeCount = subscribers.filter((s) => s.active !== false).length;
  const inactiveCount = subscribers.length - activeCount;

  const columns = [
    { key: 'email', label: 'Email Address' },
    {
      key: 'active', label: 'Status',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`status-badge ${r.active !== false ? 'status-active' : 'status-rejected'}`}>
            {r.active !== false ? 'Active' : 'Unsubscribed'}
          </span>
          <button
            onClick={() => handleToggle(r)}
            disabled={togglingId === r.id}
            title={r.active !== false ? 'Mark as unsubscribed' : 'Re-activate subscriber'}
            style={{
              border: 'none', cursor: 'pointer', borderRadius: 4, padding: '2px 8px',
              fontSize: 11, fontWeight: 600,
              background: r.active !== false ? '#ffeeba' : '#d4edda',
              color: r.active !== false ? '#856404' : '#155724',
              opacity: togglingId === r.id ? 0.5 : 1,
            }}
          >
            {togglingId === r.id ? '\u2026' : (r.active !== false ? 'Unsubscribe' : 'Re-activate')}
          </button>
        </div>
      ),
    },
    { key: 'subscribedAt', label: 'Subscribed On', render: (r) => fmt(r.subscribedAt) },
  ];

  const filterFields = [
    {
      key: 'active', label: 'Status',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Unsubscribed' },
      ],
    },
  ];

  if (loading) return <div className="page-loading"><LoadingSpinner /></div>;

  return (
    <div className="newsletter-page">
      <div className="page-header">
        <h1><i className="fas fa-paper-plane" style={{ color: '#9c27b0', marginRight: 8 }}></i>Newsletter Subscribers</h1>
        <div className="page-stats-row">
          <div className="page-stat-chip">
            <i className="fas fa-users" style={{ color: '#9c27b0' }}></i>
            <div>
              <div className="chip-val">{subscribers.length}</div>
              <div className="chip-label">Total</div>
            </div>
          </div>
          <div className="page-stat-chip">
            <i className="fas fa-check-circle" style={{ color: '#27ae60' }}></i>
            <div>
              <div className="chip-val">{activeCount}</div>
              <div className="chip-label">Active</div>
            </div>
          </div>
          <div className="page-stat-chip">
            <i className="fas fa-ban" style={{ color: '#dc3545' }}></i>
            <div>
              <div className="chip-val">{inactiveCount}</div>
              <div className="chip-label">Unsubscribed</div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="page-error"><i className="fas fa-exclamation-circle"></i>{error}</div>}

      <DataTable
        columns={columns}
        data={subscribers}
        loading={false}
        filterFields={filterFields}
        onDelete={(item) => setDeleteTarget(item)}
        onExportPDF={(rows) => exportToPDF('Newsletter Subscribers', EXPORT_COLUMNS, rows)}
        onExportWord={(rows) => exportToWord('Newsletter Subscribers', EXPORT_COLUMNS, rows)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove Subscriber"
        message={`Remove "${deleteTarget?.email}" from the newsletter list?`}
      />
    </div>
  );
}
