import { useEffect, useState, useCallback } from 'react';
import { GraduationCap, Plus, Pencil, Trash2, Users, FileText } from 'lucide-react';
import client from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { PageLoader } from '../../components/Spinner.jsx';
import { formatDate } from '../../utils/format.js';

export default function Batches() {
  const toast = useToast();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/batches');
      setBatches(res.batches);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Batch name is required');
    setSaving(true);
    try {
      if (editing) {
        await client.put(`/batches/${editing._id}`, form);
        toast.success('Batch updated');
      } else {
        await client.post('/batches', form);
        toast.success('Batch created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    await client.delete(`/batches/${deleting._id}`);
    toast.success('Batch deleted');
    setDeleting(null);
    load();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Batches <span className="text-gray-light font-medium">({batches.length})</span></h2>
          <p className="text-sm text-gray">Group students into batches and assign exams</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setModalOpen(true); }}
        >
          <Plus className="h-4 w-4" /> New Batch
        </button>
      </div>

      {batches.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-6 w-6 text-primary" />}
          title="No batches yet"
          description="Create batches like 'Morning Batch' or 'Weekend Batch' to organize your students."
          action={<button className="btn-primary" onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setModalOpen(true); }}><Plus className="h-4 w-4" /> New Batch</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((b) => (
            <div key={b._id} className="card p-5 hover:shadow-cardhover transition-shadow group">
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditing(b); setForm({ name: b.name, description: b.description || '' }); setModalOpen(true); }}
                    className="p-2 text-gray-light hover:text-primary hover:bg-primary-50 rounded-control transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(b)} className="p-2 text-gray-light hover:text-danger hover:bg-danger/5 rounded-control transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-ink mt-3.5">{b.name}</h3>
              {b.description && <p className="text-sm text-gray mt-0.5 line-clamp-2">{b.description}</p>}
              <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-line text-xs text-gray">
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {b.students} students</span>
                <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {b.exams} live exams</span>
                <span className="ml-auto">{formatDate(b.createdAt, { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Batch' : 'New Batch'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Batch'}</button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Batch Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Morning Batch (HSC)" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input !h-auto !py-2.5" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description for this batch" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={`Delete ${deleting?.name}?`}
        message="Students in this batch will be moved to unassigned. Linked exams will be opened to all students."
      />
    </div>
  );
}
