import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import ViewDetailModal from '../components/ViewDetailModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getVolunteers,
  updateVolunteerStatus,
  deleteVolunteer,
  getNewVolunteersCount,
} from '../services/db';
import { exportToPDF, exportToWord } from '../services/exportService';
import './ContentPages.css';

const EXPORT_COLUMNS = [
  { key: 'name', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'interestArea', label: 'Interest Area' },
  { key: 'availability', label: 'Availability' },
  { key: 'experience', label: 'Experience' },
  { key: 'message', label: 'Message / Motivation' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Applied On' },
];

const DETAIL_FIELDS = [
  { key: 'name', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'interestArea', label: 'Interest Area' },
  { key: 'availability', label: 'Availability' },
  { key: 'experience', label: 'Experience (Years)' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Applied On' },
  { key: 'message', label: 'Message / Motivation', fullWidth: true },
];

function fmt(ts) {
  if (!ts) return '—';
  if (ts.toDate) return ts.toDate().toLocaleDateString('en-IN');
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('en-IN');
  return String(ts);
}

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCount, setNewCount] = useState(0);

  const [viewItem, setViewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [rows, cnt] = await Promise.all([getVolunteers(), getNewVolunteersCount()]);
      setVolunteers(rows);
      setNewCount(cnt);
    } catch (e) {
      setError('Failed to load volunteers');
      console.error(e);
    }
    setLoading(false);
  }

  async function handleStatusChange(item, status) {
    try {
      await updateVolunteerStatus(item.id, status);
      setVolunteers((prev) => prev.map((v) => v.id === item.id ? { ...v, status } : v));
      if (viewItem?.id === item.id) setViewItem((d) => ({ ...d, status }));
      const cnt = await getNewVolunteersCount();
      setNewCount(cnt);
    } catch {
      alert('Failed to update status');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteVolunteer(deleteTarget.id);
      setVolunteers((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert('Failed to delete volunteer');
    }
    setDeleting(false);
  }

  const columns = [
    { key: 'name', label: 'Full Name', render: (r) => r.name || '—' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    {
      key: 'interestArea', label: 'Interest Area',
      render: (r) => {
        const area = r.interestArea || '';
        const icons = { Sports: '🏆', Healthcare: '🏥', Food: '🍱' };
        return <>{icons[area] || ''} {area || '—'}</>;
      },
    },
    {
      key: 'availability', label: 'Availability',
      render: (r) => r.availability || '—',
    },
    {
      key: 'status', label: 'Status',
      render: (r) => <span className={`status-badge status-${r.status || 'new'}`}>{r.status || 'new'}</span>,
    },
    { key: 'createdAt', label: 'Applied On', render: (r) => fmt(r.createdAt) },
  ];

  const filterFields = [
    {
      key: 'status', label: 'Status',
      options: [
        { value: 'new', label: 'New' },
        { value: 'contacted', label: 'Contacted' },
        { value: 'active', label: 'Active' },
      ],
    },
    {
      key: 'interestArea', label: 'Interest Area',
      options: [
        { value: 'Sports', label: 'Sports' },
        { value: 'Healthcare', label: 'Healthcare' },
        { value: 'Food', label: 'Food for Children' },
        { value: 'General', label: 'General' },
      ],
    },
    {
      key: 'availability', label: 'Availability',
      options: [
        { value: 'Weekdays (Mon–Fri)', label: 'Weekdays' },
        { value: 'Weekends (Sat–Sun)', label: 'Weekends' },
        { value: 'Full Week', label: 'Full Week' },
        { value: 'Part-Time (Flexible)', label: 'Part-Time' },
        { value: 'Evenings Only', label: 'Evenings Only' },
      ],
    },
  ];

  if (loading) return <div className="page-loading"><LoadingSpinner /></div>;

  return (
    <div className="volunteers-page">
      <div className="page-header">
        <h1><i className="fas fa-hands-helping" style={{ color: '#27ae60', marginRight: 8 }}></i>Volunteer Applications</h1>
        <div className="page-stats-row">
          <div className="page-stat-chip">
            <i className="fas fa-users" style={{ color: '#2196f3' }}></i>
            <div>
              <div className="chip-val">{volunteers.length}</div>
              <div className="chip-label">Total</div>
            </div>
          </div>
          <div className="page-stat-chip">
            <i className="fas fa-user-clock" style={{ color: '#f9b000' }}></i>
            <div>
              <div className="chip-val">{newCount}</div>
              <div className="chip-label">New</div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="page-error"><i className="fas fa-exclamation-circle"></i>{error}</div>}

      <DataTable
        columns={columns}
        data={volunteers}
        loading={false}
        filterFields={filterFields}
        onEdit={(item) => setViewItem(item)}
        onDelete={(item) => setDeleteTarget(item)}
        extraActions={[
          {
            label: 'Mark Contacted',
            icon: 'fas fa-phone-alt',
            className: 'contact-btn',
            onClick: (item) => handleStatusChange(item, 'contacted'),
          },
          {
            label: 'Mark Active',
            icon: 'fas fa-user-check',
            className: 'activate-btn',
            onClick: (item) => handleStatusChange(item, 'active'),
          },
        ]}
        onExportPDF={(rows) => exportToPDF('Volunteer Applications', EXPORT_COLUMNS, rows)}
        onExportWord={(rows) => exportToWord('Volunteer Applications', EXPORT_COLUMNS, rows)}
      />

      <ViewDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? `Volunteer: ${viewItem.name || ''}` : ''}
        data={viewItem}
        fields={DETAIL_FIELDS}
        footer={
          viewItem && (
            <>
              {viewItem.status !== 'contacted' && (
                <button className="btn btn-outline" onClick={() => handleStatusChange(viewItem, 'contacted')}>
                  <i className="fas fa-phone-alt"></i> Mark Contacted
                </button>
              )}
              {viewItem.status !== 'active' && (
                <button className="btn btn-primary" onClick={() => handleStatusChange(viewItem, 'active')}>
                  <i className="fas fa-user-check"></i> Activate
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
        title="Delete Volunteer"
        message={`Are you sure you want to permanently delete the application from "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
