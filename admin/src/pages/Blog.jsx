import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUpload from '../components/ImageUpload';
import { getBlogPosts, addBlogPost, updateBlogPost, deleteBlogPost } from '../services/db';
import './ContentPages.css';

const emptyForm = { title: '', imageUrl: '', date: '', author: 'Admin', commentsCount: 0, description: '' };

export default function Blog() {
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
    { key: 'date', label: 'Date' },
    { key: 'author', label: 'Author' },
    {
      key: 'commentsCount',
      label: 'Comments',
      render: (item) => item.commentsCount ?? 0,
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getBlogPosts();
      setItems(data);
    } catch (err) {
      alert('Failed to load blog posts');
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
      date: item.date || '',
      author: item.author || 'Admin',
      commentsCount: item.commentsCount ?? 0,
      description: item.description || '',
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
        ...form,
        commentsCount: Number(form.commentsCount) || 0,
      };
      if (editing) {
        await updateBlogPost(editing.id, data);
      } else {
        await addBlogPost(data);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      alert('Failed to save blog post');
      console.error(err);
    }
    setSaving(false);
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteBlogPost(deleting.id);
      setConfirmOpen(false);
      setDeleting(null);
      await loadData();
    } catch (err) {
      alert('Failed to delete blog post');
      console.error(err);
    }
    setSaving(false);
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <h1>Blog Posts</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          <i className="fas fa-plus"></i> Add Post
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
        title={editing ? 'Edit Blog Post' : 'Add Blog Post'}
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
              folder="blog"
              onUploadComplete={(url) => setForm({ ...form, imageUrl: url })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Author</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Comments Count</label>
            <input
              type="number"
              value={form.commentsCount}
              onChange={(e) => setForm({ ...form, commentsCount: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              rows="5"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
