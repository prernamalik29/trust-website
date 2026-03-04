import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUpload from '../components/ImageUpload';
import { getCauses, addCause, updateCause, deleteCause } from '../services/db';
import './ContentPages.css';

const emptyForm = { title: '', imageUrl: '', category: '', description: '', raisedAmount: '', goalAmount: '' };

export default function Causes() {
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
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    {
      key: 'raisedAmount',
      label: 'Raised',
      render: (item) => `₹${Number(item.raisedAmount).toLocaleString('en-IN')}`,
    },
    {
      key: 'goalAmount',
      label: 'Goal',
      render: (item) => `₹${Number(item.goalAmount).toLocaleString('en-IN')}`,
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (item) => {
        const pct = item.goalAmount > 0 ? Math.round((item.raisedAmount / item.goalAmount) * 100) : 0;
        return (
          <div className="progress-cell">
            <div className="mini-progress">
              <div className="mini-progress-fill" style={{ width: `${pct}%` }}></div>
            </div>
            <span>{pct}%</span>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getCauses();
      setItems(data);
    } catch (err) {
      alert('Failed to load causes');
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
      category: item.category || '',
      description: item.description || '',
      raisedAmount: item.raisedAmount || '',
      goalAmount: item.goalAmount || '',
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
      const data = {
        title: form.title,
        imageUrl: form.imageUrl,
        category: form.category,
        description: form.description,
        raisedAmount: Number(form.raisedAmount) || 0,
        goalAmount: Number(form.goalAmount) || 0,
      };
      if (editing) {
        await updateCause(editing.id, data);
      } else {
        await addCause({ ...data, status: 'active' });
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      alert('Failed to save cause');
      console.error(err);
    }
    setSaving(false);
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteCause(deleting.id);
      setConfirmOpen(false);
      setDeleting(null);
      await loadData();
    } catch (err) {
      alert('Failed to delete cause');
      console.error(err);
    }
    setSaving(false);
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <h1>Causes</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          <i className="fas fa-plus"></i> Add Cause
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
        title={editing ? 'Edit Cause' : 'Add Cause'}
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
              folder="causes"
              onUploadComplete={(url) => setForm({ ...form, imageUrl: url })}
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Sports, Health, Food"
            />
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
          <div className="form-row">
            <div className="form-group">
              <label>Raised Amount (₹)</label>
              <input
                type="number"
                value={form.raisedAmount}
                onChange={(e) => setForm({ ...form, raisedAmount: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Goal Amount (₹)</label>
              <input
                type="number"
                value={form.goalAmount}
                onChange={(e) => setForm({ ...form, goalAmount: e.target.value })}
                required
              />
            </div>
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
