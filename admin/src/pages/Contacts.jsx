import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import ViewDetailModal from '../components/ViewDetailModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getContacts,
  updateContactStatus,
  deleteContact,
  getUnreadContactsCount,
} from '../services/db';
import { exportToPDF, exportToWord } from '../services/exportService';
import './ContentPages.css';

const EXPORT_COLUMNS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'subject', label: 'Subject' },
  { key: 'message', label: 'Message' },
  { key: 'status', label: 'Status' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'createdAt', label: 'Submitted On' },
];

const DETAIL_FIELDS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'subject', label: 'Subject' },
  { key: 'status', label: 'Status' },
  { key: 'newsletter', label: 'Newsletter Opt-In' },
  { key: 'createdAt', label: 'Submitted On' },
  { key: 'message', label: 'Message', fullWidth: true },
];

function fmt(ts) {
  if (!ts) return '—';
  if (ts.toDate) return ts.toDate().toLocaleDateString('en-IN');
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('en-IN');
  return String(ts);
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const [viewItem, setViewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [rows, cnt] = await Promise.all([getContacts(), getUnreadContactsCount()]);
      setContacts(rows);
      setUnreadCount(cnt);
    } catch (e) {
      setError('Failed to load contacts');
      console.error(e);
    }
    setLoading(false);
  }

  async function handleStatusChange(item, status) {
    try {
      await updateContactStatus(item.id, status);
      setContacts((prev) => prev.map((c) => c.id === item.id ? { ...c, status } : c));
      if (viewItem?.id === item.id) setViewItem((v) => ({ ...v, status }));
      // refresh count
      const cnt = await getUnreadContactsCount();
      setUnreadCount(cnt);
    } catch (e) {
      alert('Failed to update status');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteContact(deleteTarget.id);
      setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      alert('Failed to delete contact');
    }
    setDeleting(false);
  }

  const columns = [
    {
      key: 'name', label: 'Name',
      render: (r) => `${r.firstName || ''} ${r.lastName || ''}`.trim() || '—',
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    { key: 'subject', label: 'Subject', render: (r) => r.subject || '—' },
    {
      key: 'message', label: 'Message',
      render: (r) => r.message ? r.message.slice(0, 60) + (r.message.length > 60 ? '…' : '') : '—',
    },
    {
      key: 'status', label: 'Status',
      render: (r) => <span className={`status-badge status-${r.status || 'unread'}`}>{r.status || 'unread'}</span>,
    },
    { key: 'createdAt', label: 'Date', render: (r) => fmt(r.createdAt) },
  ];

  const filterFields = [
    {
      key: 'status', label: 'Status',
      options: [
        { value: 'unread', label: 'Unread' },
        { value: 'read', label: 'Read' },
        { value: 'resolved', label: 'Resolved' },
      ],
    },
    {
      key: 'subject', label: 'Subject',
      options: [
        { value: 'general', label: 'General' },
        { value: 'donation', label: 'Donation' },
        { value: 'volunteer', label: 'Volunteer' },
        { value: 'partnership', label: 'Partnership' },
        { value: 'sports', label: 'Sports' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'food', label: 'Food' },
        { value: 'other', label: 'Other' },
      ],
    },
  ];

  if (loading) return <div className="page-loading"><LoadingSpinner /></div>;

  return (
    <div className="contacts-page">
      <div className="page-header">
        <h1><i className="fas fa-envelope" style={{ color: '#2196f3', marginRight: 8 }}></i>Contacts &amp; Messages</h1>
        <div className="page-stats-row">
          <div className="page-stat-chip">
            <i className="fas fa-inbox" style={{ color: '#f9b000' }}></i>
            <div>
              <div className="chip-val">{contacts.length}</div>
              <div className="chip-label">Total</div>
            </div>
          </div>
          <div className="page-stat-chip">
            <i className="fas fa-envelope-open" style={{ color: '#e74c3c' }}></i>
            <div>
              <div className="chip-val">{unreadCount}</div>
              <div className="chip-label">Unread</div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="page-error"><i className="fas fa-exclamation-circle"></i>{error}</div>}

      <DataTable
        columns={columns}
        data={contacts}
        loading={false}
        filterFields={filterFields}
        onEdit={(item) => { handleStatusChange(item, 'read'); setViewItem(item); }}
        onDelete={(item) => setDeleteTarget(item)}
        extraActions={[
          {
            label: 'Mark Resolved',
            icon: 'fas fa-check-circle',
            className: 'resolve-btn',
            onClick: (item) => handleStatusChange(item, 'resolved'),
          },
        ]}
        onExportPDF={(rows) => exportToPDF('Contact Submissions', EXPORT_COLUMNS, rows)}
        onExportWord={(rows) => exportToWord('Contact Submissions', EXPORT_COLUMNS, rows)}
      />

      {/* Detail modal */}
      <ViewDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? `Message from ${viewItem.firstName || ''} ${viewItem.lastName || ''}`.trim() : ''}
        data={viewItem}
        fields={DETAIL_FIELDS}
        footer={
          viewItem && (
            <>
              {viewItem.status !== 'read' && (
                <button className="btn btn-outline" onClick={() => handleStatusChange(viewItem, 'read')}>
                  <i className="fas fa-eye"></i> Mark Read
                </button>
              )}
              {viewItem.status !== 'resolved' && (
                <button className="btn btn-primary" onClick={() => handleStatusChange(viewItem, 'resolved')}>
                  <i className="fas fa-check-circle"></i> Resolve
                </button>
              )}
            </>
          )
        }
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Contact"
        message={`Are you sure you want to permanently delete the message from "${deleteTarget?.firstName} ${deleteTarget?.lastName}"?`}
      />
    </div>
  );
}
