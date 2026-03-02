import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import ViewDetailModal from '../components/ViewDetailModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getEventRegistrations,
  updateEventRegStatus,
  deleteEventRegistration,
} from '../services/db';
import { exportToPDF, exportToWord } from '../services/exportService';
import './ContentPages.css';

const EXPORT_COLUMNS = [
  { key: 'participantName', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'age', label: 'Age' },
  { key: 'gender', label: 'Gender' },
  { key: 'eventName', label: 'Event' },
  { key: 'eventCategory', label: 'Category' },
  { key: 'eventDate', label: 'Event Date' },
  { key: 'tshirtSize', label: 'T-Shirt Size' },
  { key: 'emergencyContact', label: 'Emergency Contact' },
  { key: 'medicalConditions', label: 'Medical Conditions' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Registered On' },
];

const DETAIL_FIELDS = [
  { key: 'participantName', label: 'Participant Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'age', label: 'Age' },
  { key: 'gender', label: 'Gender' },
  { key: 'eventName', label: 'Event Registered For' },
  { key: 'eventCategory', label: 'Event Category' },
  { key: 'eventDate', label: 'Event Date' },
  { key: 'tshirtSize', label: 'T-Shirt Size' },
  { key: 'emergencyContact', label: 'Emergency Contact Name' },
  { key: 'emergencyPhone', label: 'Emergency Contact Phone' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Registered On' },
  { key: 'medicalConditions', label: 'Medical Conditions / Notes', fullWidth: true },
  { key: 'address', label: 'Address', fullWidth: true },
];

function fmt(ts) {
  if (!ts) return '—';
  if (ts.toDate) return ts.toDate().toLocaleDateString('en-IN');
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('en-IN');
  return String(ts);
}

export default function EventRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewItem, setViewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const rows = await getEventRegistrations();
      setRegistrations(rows);
    } catch (e) {
      setError('Failed to load event registrations');
      console.error(e);
    }
    setLoading(false);
  }

  async function handleStatusChange(item, status) {
    try {
      await updateEventRegStatus(item.id, status);
      setRegistrations((prev) => prev.map((r) => r.id === item.id ? { ...r, status } : r));
      if (viewItem?.id === item.id) setViewItem((d) => ({ ...d, status }));
    } catch {
      alert('Failed to update status');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEventRegistration(deleteTarget.id);
      setRegistrations((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert('Failed to delete registration');
    }
    setDeleting(false);
  }

  const pendingCount = registrations.filter((r) => !r.status || r.status === 'pending').length;
  const confirmedCount = registrations.filter((r) => r.status === 'confirmed').length;

  const columns = [
    { key: 'participantName', label: 'Participant', render: (r) => r.participantName || '—' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    {
      key: 'eventName', label: 'Event',
      render: (r) => (
        <span style={{ fontWeight: 600 }}>{r.eventName || '—'}</span>
      ),
    },
    {
      key: 'eventCategory', label: 'Category',
      render: (r) => {
        const icons = { Sports: '🏆', Healthcare: '🏥', Food: '🍱' };
        return <>{icons[r.eventCategory] || ''} {r.eventCategory || '—'}</>;
      },
    },
    { key: 'eventDate', label: 'Event Date', render: (r) => r.eventDate || '—' },
    {
      key: 'status', label: 'Status',
      render: (r) => (
        <span className={`status-badge status-${r.status || 'pending'}`}>{r.status || 'pending'}</span>
      ),
    },
    { key: 'createdAt', label: 'Registered', render: (r) => fmt(r.createdAt) },
  ];

  const filterFields = [
    {
      key: 'status', label: 'Status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      key: 'eventCategory', label: 'Category',
      options: [
        { value: 'Sports', label: 'Sports' },
        { value: 'Healthcare', label: 'Healthcare' },
        { value: 'Food', label: 'Food for Children' },
      ],
    },
    {
      key: 'gender', label: 'Gender',
      options: [
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'Other', label: 'Other' },
      ],
    },
  ];

  if (loading) return <div className="page-loading"><LoadingSpinner /></div>;

  return (
    <div className="event-regs-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-calendar-check" style={{ color: '#f9b000', marginRight: 8 }}></i>
          Event Registrations
        </h1>
        <div className="page-stats-row">
          <div className="page-stat-chip">
            <i className="fas fa-users" style={{ color: '#2196f3' }}></i>
            <div>
              <div className="chip-val">{registrations.length}</div>
              <div className="chip-label">Total</div>
            </div>
          </div>
          <div className="page-stat-chip">
            <i className="fas fa-clock" style={{ color: '#f9b000' }}></i>
            <div>
              <div className="chip-val">{pendingCount}</div>
              <div className="chip-label">Pending</div>
            </div>
          </div>
          <div className="page-stat-chip">
            <i className="fas fa-check-circle" style={{ color: '#27ae60' }}></i>
            <div>
              <div className="chip-val">{confirmedCount}</div>
              <div className="chip-label">Confirmed</div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="page-error"><i className="fas fa-exclamation-circle"></i>{error}</div>}

      <DataTable
        columns={columns}
        data={registrations}
        loading={false}
        filterFields={filterFields}
        onEdit={(item) => setViewItem(item)}
        onDelete={(item) => setDeleteTarget(item)}
        extraActions={[
          {
            label: 'Confirm Registration',
            icon: 'fas fa-check',
            className: 'confirm-btn',
            onClick: (item) => handleStatusChange(item, 'confirmed'),
          },
          {
            label: 'Cancel Registration',
            icon: 'fas fa-ban',
            className: 'reject-btn',
            onClick: (item) => handleStatusChange(item, 'cancelled'),
          },
        ]}
        onExportPDF={(rows) => exportToPDF('Event Registrations', EXPORT_COLUMNS, rows)}
        onExportWord={(rows) => exportToWord('Event Registrations', EXPORT_COLUMNS, rows)}
      />

      <ViewDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? `Registration: ${viewItem.participantName || ''}` : ''}
        data={viewItem}
        fields={DETAIL_FIELDS}
        footer={
          viewItem && (
            <>
              {viewItem.status !== 'confirmed' && (
                <button className="btn btn-primary" onClick={() => handleStatusChange(viewItem, 'confirmed')}>
                  <i className="fas fa-check"></i> Confirm
                </button>
              )}
              {viewItem.status !== 'cancelled' && (
                <button className="btn btn-danger" onClick={() => handleStatusChange(viewItem, 'cancelled')}>
                  <i className="fas fa-ban"></i> Cancel
                </button>
              )}
            </>
          )
        }
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Registration"
        message={`Permanently delete the registration for "${deleteTarget?.participantName}"?`}
      />
    </div>
  );
}
