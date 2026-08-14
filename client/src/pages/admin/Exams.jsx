import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Rocket, FileText, Users, Clock } from 'lucide-react';
import client from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import Badge from '../../components/Badge.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/Spinner.jsx';
import { formatDateTime } from '../../utils/format.js';

function statusOf(exam) {
  const s = exam.computedStatus || exam.status;
  return {
    live: { label: 'Live', variant: 'live' },
    draft: { label: 'Draft', variant: 'draft' },
    completed: { label: 'Completed', variant: 'completed' },
  }[s] || { label: s, variant: 'neutral' };
}

export default function Exams() {
  const toast = useToast();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filter) params.status = filter;
      const res = await client.get('/exams', { params });
      setExams(res.exams);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const publish = async (exam) => {
    try {
      await client.post(`/exams/${exam._id}/publish`);
      toast.success(`"${exam.title}" is now live`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const unpublish = async (exam) => {
    try {
      await client.post(`/exams/${exam._id}/unpublish`);
      toast.success('Exam returned to draft');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    await client.delete(`/exams/${deleting._id}`);
    toast.success('Exam deleted');
    setDeleting(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Exams <span className="text-gray-light font-medium">({exams.length})</span></h2>
          <p className="text-sm text-gray">Create, publish and manage your exams</p>
        </div>
        <Link to="/admin/exams/new" className="btn-primary sm:ml-auto"><Plus className="h-4 w-4" /> New Exam</Link>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-gray-light absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exams…" className="input !pl-9" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input !w-40">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : exams.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6 text-primary" />}
          title="No exams yet"
          description="Build your first exam from your question bank and publish it to your students."
          action={<Link to="/admin/exams/new" className="btn-primary"><Plus className="h-4 w-4" /> New Exam</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Schedule</th>
                  <th>Questions</th>
                  <th>Attempts</th>
                  <th>Pass Rate</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => {
                  const st = statusOf(exam);
                  return (
                    <tr key={exam._id}>
                      <td>
                        <Link to={`/admin/exams/${exam._id}/edit`} className="font-medium text-ink hover:text-primary transition-colors">{exam.title}</Link>
                        <p className="text-xs text-gray flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3" /> {exam.duration} min · {exam.subject || 'General'}
                          {exam.batch && <span>· {exam.batch.name}</span>}
                        </p>
                      </td>
                      <td className="text-sm text-gray whitespace-nowrap">{formatDateTime(exam.startAt)}</td>
                      <td className="text-sm text-ink font-medium">{exam.questionCount}</td>
                      <td className="text-sm text-ink font-medium">{exam.attempts}</td>
                      <td className="text-sm text-ink font-medium">
                        {exam.attempts ? `${Math.round((exam.passCount / exam.attempts) * 100)}%` : '—'}
                      </td>
                      <td><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {exam.status === 'draft' && (
                            <button onClick={() => publish(exam)} title="Publish" className="p-2 text-gray-light hover:text-success hover:bg-success/5 rounded-control transition-colors">
                              <Rocket className="h-4 w-4" />
                            </button>
                          )}
                          {exam.status === 'live' && (
                            <button onClick={() => unpublish(exam)} title="Unpublish" className="p-2 text-gray-light hover:text-warning-dark hover:bg-warning/5 rounded-control transition-colors">
                              <Rocket className="h-4 w-4 rotate-180" />
                            </button>
                          )}
                          <Link to={`/admin/exams/${exam._id}/edit`} title="Edit" className="p-2 text-gray-light hover:text-primary hover:bg-primary-50 rounded-control transition-colors">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button onClick={() => setDeleting(exam)} title="Delete" className="p-2 text-gray-light hover:text-danger hover:bg-danger/5 rounded-control transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={`Delete "${deleting?.title}"?`}
        message="All attempts and results for this exam will be permanently deleted."
      />
    </div>
  );
}
