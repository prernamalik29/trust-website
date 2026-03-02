import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { getNewsletterSubscribers, deleteNewsletterSubscriber } from '../services/db';
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

  const columns = [
    { key: 'email', label: 'Email Address' },
    {
      key: 'active', label: 'Status',
      render: (r) => (
        <span className={`status-badge ${r.active !== false ? 'status-active' : 'status-rejected'}`}>
          {r.active !== false ? 'Active' : 'Unsubscribed'}
        </span>
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
