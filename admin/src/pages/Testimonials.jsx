import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUpload from '../components/ImageUpload';
import { getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial } from '../services/db';
import './ContentPages.css';

const emptyForm = { name: '', role: '', imageUrl: '', quote: '' };

export default function Testimonials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const columns = [
    {
      key: 'imageUrl',
      label: 'Image',
      render: (item) =>
        item.imageUrl ? <img src={item.imageUrl} alt="" className="table-thumbnail" /> : '—',
    },
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    {
      key: 'quote',
      label: 'Quote',
      render: (item) => (item.quote?.length > 60 ? item.quote.substring(0, 60) + '...' : item.quote),
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getTestimonials();
      setItems(data);
    } catch (err) {
      alert('Failed to load testimonials');
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
      name: item.name || '',
      role: item.role || '',
      imageUrl: item.imageUrl || '',
      quote: item.quote || '',
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
      if (editing) {
        await updateTestimonial(editing.id, data);
      } else {
        await addTestimonial(data);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      alert('Failed to save testimonial');
      console.error(err);
    }
    setSaving(false);
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteTestimonial(deleting.id);
      setConfirmOpen(false);
      setDeleting(null);
      await loadData();
    } catch (err) {
      alert('Failed to delete testimonial');
      console.error(err);
    }
    setSaving(false);
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <h1>Testimonials</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          <i className="fas fa-plus"></i> Add Testimonial
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
        title={editing ? 'Edit Testimonial' : 'Add Testimonial'}
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Image</label>
            <ImageUpload
              currentImageUrl={form.imageUrl}
              folder="testimonials"
              onUploadComplete={(url) => setForm({ ...form, imageUrl: url })}
            />
          </div>
          <div className="form-group">
            <label>Quote</label>
            <textarea
              rows="4"
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
              required
            ></textarea>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
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
    </div>
  );
}
