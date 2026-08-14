import { useEffect, useState, useCallback } from 'react';
import { Megaphone, Plus, Trash2, Users, Layers } from 'lucide-react';
import client from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Badge from '../../components/Badge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { PageLoader } from '../../components/Spinner.jsx';
import { timeAgo } from '../../utils/format.js';

export default function Announcements() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', audience: 'all', batches: [] });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/announcements');
      setItems(res.announcements);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    client.get('/batches').then((r) => setBatches(r.batches)).catch(() => {});
  }, []);

  const save = async () => {
    if (!form.title.trim() || !form.message.trim()) return toast.error('Title and message are required');
    setSaving(true);
    try {
      await client.post('/announcements', form);
      toast.success('Announcement posted');
      setModalOpen(false);
      setForm({ title: '', message: '', audience: 'all', batches: [] });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    await client.delete(`/announcements/${deleting._id}`);
    toast.success('Announcement deleted');
    setDeleting(null);
    load();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Announcements</h2>
          <p className="text-sm text-gray">Keep students informed about exams and events</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> New Announcement</button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-6 w-6 text-primary" />}
          title="No announcements yet"
          description="Post exam schedule updates, reminders or important notices for your students."
          action={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> New Announcement</button>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a._id} className="card p-5 hover:shadow-cardhover transition-shadow group">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary flex items-center justify-center shrink-0">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-ink">{a.title}</h3>
                    <Badge variant="info">{a.audience === 'all' ? <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> All students</span> : <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3" /> Selected batches</span>}</Badge>
                  </div>
                  <p className="text-sm text-gray mt-1.5 leading-relaxed">{a.message}</p>
                  <p className="text-xs text-gray-light mt-2.5">{timeAgo(a.createdAt)}</p>
                </div>
                <button onClick={() => setDeleting(a)} className="p-2 text-gray-light hover:text-danger hover:bg-danger/5 rounded-control opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Announcement"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Posting…' : 'Post Announcement'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Weekly test schedule updated" />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input !h-auto !py-3" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Write your announcement…" />
          </div>
          <div>
            <label className="label">Audience</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setForm({ ...form, audience: 'all' })}
                className={`py-2.5 rounded-control text-sm font-medium border transition-all ${form.audience === 'all' ? 'bg-primary-50 border-primary/40 text-primary-600' : 'border-line text-gray hover:border-primary/30'}`}
              >
                All students
              </button>
              <button
                onClick={() => setForm({ ...form, audience: 'batches' })}
                className={`py-2.5 rounded-control text-sm font-medium border transition-all ${form.audience === 'batches' ? 'bg-primary-50 border-primary/40 text-primary-600' : 'border-line text-gray hover:border-primary/30'}`}
              >
                Selected batches
              </button>
            </div>
          </div>
          {form.audience === 'batches' && (
            <div>
              <label className="label">Batches</label>
              <div className="space-y-2">
                {batches.map((b) => (
                  <label key={b._id} className="flex items-center gap-2.5 p-2.5 rounded-control border border-line cursor-pointer hover:border-primary/30">
                    <input
                      type="checkbox"
                      checked={form.batches.includes(b._id)}
                      onChange={(e) => {
                        const list = e.target.checked
                          ? [...form.batches, b._id]
                          : form.batches.filter((x) => x !== b._id);
                        setForm({ ...form, batches: list });
                      }}
                      className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-ink">{b.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this announcement?"
        message="Students will no longer see this announcement."
      />
    </div>
  );
}
