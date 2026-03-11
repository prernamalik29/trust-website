import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUpload from '../components/ImageUpload';
import { getEvents, addEvent, updateEvent, deleteEvent } from '../services/db';
import './ContentPages.css';

const emptyForm = { title: '', imageUrl: '', day: '', month: '', year: '2026', time: '', location: '', category: '', description: '', status: 'upcoming', featured: false };

export default function Events() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const columns = [
    {
      key: 'imageUrl',
      label: 'Image',
      render: (item) =>
        item.imageUrl ? <img src={item.imageUrl} alt="" className="table-thumbnail" /> : '—',
    },
    { key: 'title', label: 'Title' },
    {
      key: 'date',
      label: 'Date',
      render: (item) => `${item.day} ${item.month}`,
    },
    { key: 'location', label: 'Location' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getEvents();
      setItems(data);
    } catch (err) {
      alert('Failed to load events');
      console.error(err);
    }
    setLoading(false);
  }

  function handleAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function handleEdit(item) {
    setEditing(item);
    setForm({
      title: item.title || '',
      imageUrl: item.imageUrl || '',
      day: item.day || '',
      month: item.month || '',
      year: item.year || '2026',
      time: item.time || '',
      location: item.location || '',
      category: item.category || '',
      description: item.description || '',
      status: item.status || 'upcoming',
      featured: item.featured ?? false,
    });
    setModalOpen(true);
  }

  function handleDeleteClick(item) {
    setDeleting(item);
    setConfirmOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form };
      // Derive a proper Timestamp-compatible Date for server-side date ordering
      const MONTHS = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
      const mo = MONTHS[data.month] ?? 0;
      data.date = new Date(Number(data.year || 2026), mo, Number(data.day || 1));
      if (editing) {
        await updateEvent(editing.id, data);
      } else {
        await addEvent({ ...data, status: data.status || 'upcoming', featured: data.featured ?? false });
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      const msg = err?.code === 'permission-denied'
        ? 'Permission denied — make sure you are logged in as admin.'
        : `Failed to save event: ${err?.message || err?.code || 'unknown error'}`;
      alert(msg);
      console.error(err);
    }
    setSaving(false);
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteEvent(deleting.id);
      setConfirmOpen(false);
      setDeleting(null);
      await loadData();
    } catch (err) {
      alert('Failed to delete event');
      console.error(err);
    }
    setSaving(false);
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <h1>Events</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          <i className="fas fa-plus"></i> Add Event
        </button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Event' : 'Add Event'}
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Image</label>
            <ImageUpload
              currentImageUrl={form.imageUrl}
              folder="events"
              onUploadComplete={(url) => setForm({ ...form, imageUrl: url })}
              onUploadingChange={setImageUploading}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Day (e.g. 08)</label>
              <input
                type="text"
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                placeholder="08"
                required
              />
            </div>
            <div className="form-group">
              <label>Month (e.g. Mar)</label>
              <input
                type="text"
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
                placeholder="Mar"
                required
              />
            </div>
            <div className="form-group">
              <label>Year</label>
              <input
                type="text"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder="2026"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Sports, Health, Community"
              />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input
                type="text"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                placeholder="9:00 AM - 6:00 PM"
                required
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="4"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            ></textarea>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || imageUploading}>
              {imageUploading ? 'Uploading image...' : saving ? 'Saving...' : editing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={saving}
      />

      {/* ── View Gallery shortcut ── */}
      <div style={{
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--admin-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-light)', margin: 0 }}>
          Events marked as <strong>completed</strong> appear in the public Event Gallery.
        </p>
        <Link
          to="/admin/gallery"
          className="btn btn-primary"
          style={{ textDecoration: 'none' }}
        >
          <i className="fas fa-images" />
          View Past Event Gallery
        </Link>
      </div>
    </div>
  );
}
