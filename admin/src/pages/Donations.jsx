import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import ViewDetailModal from '../components/ViewDetailModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getDonations,
  updateDonationStatus,
  deleteDonation,
} from '../services/db';
import { exportToPDF, exportToWord } from '../services/exportService';
import './ContentPages.css';

const EXPORT_COLUMNS = [
  { key: 'donorName', label: 'Donor Name' },
  { key: 'donorEmail', label: 'Email' },
  { key: 'donorPhone', label: 'Phone' },
  { key: 'amount', label: 'Amount (₹)' },
  { key: 'cause', label: 'Cause' },
  { key: 'donationType', label: 'Type' },
  { key: 'donorPAN', label: 'PAN' },
  { key: 'anonymous', label: 'Anonymous' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Submitted On' },
];

const DETAIL_FIELDS = [
  { key: 'donorName', label: 'Donor Name' },
  { key: 'donorEmail', label: 'Email' },
  { key: 'donorPhone', label: 'Phone' },
  { key: 'amount', label: 'Amount (₹)' },
  { key: 'cause', label: 'Cause' },
  { key: 'donationType', label: 'Donation Type' },
  { key: 'donorPAN', label: 'PAN Number' },
  { key: 'anonymous', label: 'Anonymous' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Submitted On' },
  { key: 'donorAddress', label: 'Address', fullWidth: true },
];

function fmt(ts) {
  if (!ts) return '—';
  if (ts.toDate) return ts.toDate().toLocaleDateString('en-IN');
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('en-IN');
  return String(ts);
}

function calcSummary(donations) {
  let confirmed = 0, pending = 0, total = 0;
  donations.forEach((d) => {
    const amt = Number(d.amount) || 0;
    if (d.status === 'confirmed') confirmed += amt;
    if (!d.status || d.status === 'pending') pending += amt;
    total += amt;
  });
  return { confirmed, pending, total };
}

export default function Donations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewItem, setViewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const rows = await getDonations();
      setDonations(rows);
    } catch (e) {
      setError('Failed to load donations');
      console.error(e);
    }
    setLoading(false);
  }

  async function handleStatusChange(item, status) {
    try {
      await updateDonationStatus(item.id, status);
      setDonations((prev) => prev.map((d) => d.id === item.id ? { ...d, status } : d));
      if (viewItem?.id === item.id) setViewItem((d) => ({ ...d, status }));
    } catch {
      alert('Failed to update status');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDonation(deleteTarget.id);
      setDonations((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert('Failed to delete donation');
    }
    setDeleting(false);
  }

  const summary = calcSummary(donations);

  const columns = [
    { key: 'donorName', label: 'Donor', render: (r) => r.anonymous ? '🕵️ Anonymous' : (r.donorName || '—') },
    { key: 'donorEmail', label: 'Email', render: (r) => r.anonymous ? '—' : (r.donorEmail || '—') },
    {
      key: 'amount', label: 'Amount (₹)',
      render: (r) => <strong>₹{(Number(r.amount) || 0).toLocaleString('en-IN')}</strong>,
    },
    {
      key: 'cause', label: 'Cause',
      render: (r) => {
        const icons = { sports: '🏆', healthcare: '🏥', food: '🍱', general: '💛' };
        return <>{icons[r.cause] || ''} {(r.cause || 'general').charAt(0).toUpperCase() + (r.cause || 'general').slice(1)}</>;
      },
    },
    {
      key: 'donationType', label: 'Type',
      render: (r) => r.donationType === 'monthly' ? '🔁 Monthly' : '1️⃣ One-time',
    },
    {
      key: 'status', label: 'Status',
      render: (r) => <span className={`status-badge status-${r.status || 'pending'}`}>{r.status || 'pending'}</span>,
    },
    { key: 'createdAt', label: 'Date', render: (r) => fmt(r.createdAt) },
  ];

  const filterFields = [
    {
      key: 'status', label: 'Status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    {
      key: 'cause', label: 'Cause',
      options: [
        { value: 'general', label: 'General' },
        { value: 'sports', label: 'Sports' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'food', label: 'Food for Children' },
      ],
    },
    {
      key: 'donationType', label: 'Type',
      options: [
        { value: 'onetime', label: 'One-time' },
        { value: 'monthly', label: 'Monthly' },
      ],
    },
  ];

  if (loading) return <div className="page-loading"><LoadingSpinner /></div>;

  return (
    <div className="donations-page">
      <div className="page-header">
        <h1><i className="fas fa-donate" style={{ color: '#27ae60', marginRight: 8 }}></i>Donation Records</h1>
        <div className="page-stats-row">
          <div className="page-stat-chip">
            <i className="fas fa-rupee-sign" style={{ color: '#27ae60' }}></i>
            <div>
              <div className="chip-val">₹{summary.total.toLocaleString('en-IN')}</div>
              <div className="chip-label">Total Received</div>
            </div>
          </div>
          <div className="page-stat-chip">
            <i className="fas fa-check-circle" style={{ color: '#27ae60' }}></i>
            <div>
              <div className="chip-val">₹{summary.confirmed.toLocaleString('en-IN')}</div>
              <div className="chip-label">Confirmed</div>
            </div>
          </div>
          <div className="page-stat-chip">
            <i className="fas fa-clock" style={{ color: '#f9b000' }}></i>
            <div>
              <div className="chip-val">₹{summary.pending.toLocaleString('en-IN')}</div>
              <div className="chip-label">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="page-error"><i className="fas fa-exclamation-circle"></i>{error}</div>}

      <DataTable
        columns={columns}
        data={donations}
        loading={false}
        filterFields={filterFields}
        onEdit={(item) => setViewItem(item)}
        onDelete={(item) => setDeleteTarget(item)}
        extraActions={[
          {
            label: 'Confirm',
            icon: 'fas fa-check',
            className: 'confirm-btn',
            onClick: (item) => handleStatusChange(item, 'confirmed'),
          },
          {
            label: 'Reject',
            icon: 'fas fa-times',
            className: 'reject-btn',
            onClick: (item) => handleStatusChange(item, 'rejected'),
          },
        ]}
        onExportPDF={(rows) => exportToPDF('Donation Records', EXPORT_COLUMNS, rows)}
        onExportWord={(rows) => exportToWord('Donation Records', EXPORT_COLUMNS, rows)}
      />

      <ViewDetailModal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? `Donation — ${viewItem.anonymous ? 'Anonymous' : (viewItem.donorName || '')}` : ''}
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
              {viewItem.status !== 'rejected' && (
                <button className="btn btn-danger" onClick={() => handleStatusChange(viewItem, 'rejected')}>
                  <i className="fas fa-times"></i> Reject
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
        title="Delete Donation Record"
        message={`Are you sure you want to permanently delete this donation record?`}
      />
    </div>
  );
}
