import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Upload, Pencil, Trash2, Filter, Users } from 'lucide-react';
import client from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/Modal.jsx';
import Drawer from '../../components/Drawer.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Badge from '../../components/Badge.jsx';
import Avatar from '../../components/Avatar.jsx';
import Pagination from '../../components/Pagination.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/Spinner.jsx';
import { formatDate } from '../../utils/format.js';

const emptyForm = { name: '', studentId: '', email: '', phone: '', batch: '', password: '' };

export default function Students() {
  const toast = useToast();
  const [data, setData] = useState({ students: [], total: 0 });
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (batchFilter) params.batch = batchFilter;
      const res = await client.get('/students', { params });
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [page, search, batchFilter]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    client.get('/batches').then((r) => setBatches(r.batches)).catch(() => {});
  }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setFormError(''); setModalOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name, studentId: s.studentId || '', email: s.email, phone: s.phone || '',
      batch: s.batch?._id || '', password: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.email.trim() || (!editing && !form.password))
      return setFormError('Name, email and password are required');
    setSaving(true);
    try {
      if (editing) {
        const payload = { ...form, password: form.password || undefined };
        await client.put(`/students/${editing._id}`, payload);
        toast.success('Student updated');
      } else {
        await client.post('/students', form);
        toast.success('Student added');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    await client.delete(`/students/${deleting._id}`);
    toast.success('Student deleted');
    setDeleting(null);
    load();
  };

  const importCsv = async () => {
    if (!csvText.trim()) return toast.error('Paste CSV content first');
    setSaving(true);
    try {
      const res = await client.post('/students/import', { csv: csvText });
      toast.success(`${res.created} students imported${res.skipped ? `, ${res.skipped} skipped` : ''}`);
      setCsvOpen(false);
      setCsvText('');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Students <span className="text-gray-light font-medium">({data.total})</span></h2>
          <p className="text-sm text-gray">Manage your student roster and access</p>
        </div>
        <div className="flex gap-3 sm:ml-auto">
          <button className="btn-secondary" onClick={() => setCsvOpen(true)}>
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-gray-light absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email or ID…"
            className="input !pl-9"
          />
        </div>
        <div className="relative">
          <Filter className="h-4 w-4 text-gray-light absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={batchFilter}
            onChange={(e) => { setBatchFilter(e.target.value); setPage(1); }}
            className="input !pl-9 !w-48"
          >
            <option value="">All Batches</option>
            {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : data.students.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6 text-primary" />}
          title="No students found"
          description="Add students one by one or import them in bulk from a CSV file."
          action={<button className="btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Add Student</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Email</th>
                  <th>Batch</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} color={s.avatarColor} size={36} />
                        <span className="font-medium text-ink">{s.name}</span>
                      </div>
                    </td>
                    <td className="text-sm text-gray">{s.studentId || '—'}</td>
                    <td className="text-sm text-gray">{s.email}</td>
                    <td><Badge variant="info">{s.batch?.name || 'Unassigned'}</Badge></td>
                    <td className="text-sm text-gray whitespace-nowrap">{formatDate(s.createdAt)}</td>
                    <td><Badge variant={s.status === 'active' ? 'active' : 'suspended'}>{s.status}</Badge></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} title="Edit" className="p-2 text-gray-light hover:text-primary hover:bg-primary-50 rounded-control transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleting(s)} title="Delete" className="p-2 text-gray-light hover:text-danger hover:bg-danger/5 rounded-control transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={data.total} limit={data.limit || 20} onChange={setPage} />
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Student' : 'Add New Student'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Save Student'}
            </button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
          {formError && <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-control px-3 py-2.5">{formError}</p>}
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ayesha Rahman" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Student ID</label>
              <input className="input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="ST-011" />
            </div>
            <div>
              <label className="label">Batch</label>
              <select className="input" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })}>
                <option value="">No batch</option>
                {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@email.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="017XXXXXXXX" />
            </div>
            <div>
              <label className="label">{editing ? 'New Password' : 'Password'}</label>
              <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? 'Leave blank to keep' : 'Default: Exam@123'} />
            </div>
          </div>
        </form>
      </Modal>

      {/* Import modal */}
      <Modal
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        title="Import Students from CSV"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCsvOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={importCsv} disabled={saving}>
              <Upload className="h-4 w-4" /> {saving ? 'Importing…' : 'Import Students'}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray mb-4">
          Paste CSV content. Required columns: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-ink">name</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-ink">email</code>. Optional: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-ink">studentId</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-ink">phone</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-ink">password</code>.
        </p>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={9}
          className="input !h-auto !py-3 font-mono !text-xs"
          placeholder={'name,email,studentId,phone,password\nRahim Uddin,rahim@student.com,ST-101,01700000000,Exam@123\nSadia Khan,sadia@student.com,ST-102,01711111111,'}
        />
        <button className="btn-ghost !px-0 mt-3" onClick={() => setCsvText('name,email,studentId,phone,password\nRahim Uddin,rahim@student.com,ST-101,01700000000,Exam@123\nSadia Khan,sadia@student.com,ST-102,01711111111,')}>
          Use sample data
        </button>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={`Delete ${deleting?.name}?`}
        message="This student's account and exam attempts will be permanently removed."
      />
    </div>
  );
}
