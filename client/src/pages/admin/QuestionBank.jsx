import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Pencil, Copy, Trash2, Database, ListFilter } from 'lucide-react';
import client from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import Drawer from '../../components/Drawer.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Badge from '../../components/Badge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/Spinner.jsx';
import { difficultyStyles, typeLabels, timeAgo } from '../../utils/format.js';

const emptyForm = { type: 'MCQ', question: '', options: ['', '', '', ''], correctIndex: -1, correctAnswer: '', difficulty: 'medium', subject: '', topic: '', marks: 1 };

export default function QuestionBank() {
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [type, setType] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (subject) params.subject = subject;
      if (difficulty) params.difficulty = difficulty;
      if (type) params.type = type;
      const res = await client.get('/questions', { params });
      setQuestions(res.questions);
    } finally {
      setLoading(false);
    }
  }, [search, subject, difficulty, type]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    client.get('/questions/meta').then((r) => setSubjects(r.subjects)).catch(() => {});
  }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setFormError(''); setDrawerOpen(true); };
  const openEdit = (q) => {
    setEditing(q);
    const options = q.type === 'MCQ' ? q.options.map((o) => o.text) : ['', '', '', ''];
    const correctIndex = q.type === 'MCQ' ? q.options.findIndex((o) => o.isCorrect) : -1;
    setForm({
      type: q.type, question: q.question, options, correctIndex,
      correctAnswer: q.correctAnswer || '', difficulty: q.difficulty, subject: q.subject || '',
      topic: q.topic || '', marks: q.marks || 1,
    });
    setFormError('');
    setDrawerOpen(true);
  };

  const buildPayload = () => {
    const base = {
      type: form.type, question: form.question, difficulty: form.difficulty,
      subject: form.subject, topic: form.topic, tags: [form.subject, form.topic].filter(Boolean), marks: Number(form.marks) || 1,
    };
    if (form.type === 'MCQ') {
      base.options = form.options.map((text, i) => ({ text, isCorrect: i === form.correctIndex }));
      base.correctAnswer = '';
    } else if (form.type === 'TF') {
      base.options = [];
      base.correctAnswer = form.correctAnswer;
    } else {
      base.options = [];
      base.correctAnswer = form.correctAnswer;
    }
    return base;
  };

  const save = async () => {
    setFormError('');
    if (!form.question.trim()) return setFormError('Question text is required');
    if (form.type === 'MCQ') {
      const filled = form.options.filter((o) => o.trim());
      if (filled.length < 2) return setFormError('Add at least 2 options');
      if (form.correctIndex < 0) return setFormError('Mark one option as correct');
    }
    if ((form.type === 'TF' || form.type === 'SA') && !form.correctAnswer.trim())
      return setFormError('Provide the correct answer');

    setSaving(true);
    try {
      if (editing) await client.put(`/questions/${editing._id}`, buildPayload());
      else await client.post('/questions', buildPayload());
      toast.success(editing ? 'Question updated' : 'Question added');
      setDrawerOpen(false);
      load();
      client.get('/questions/meta').then((r) => setSubjects(r.subjects)).catch(() => {});
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async (q) => {
    try {
      await client.post(`/questions/${q._id}/duplicate`);
      toast.success('Question duplicated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    await client.delete(`/questions/${deleting._id}`);
    toast.success('Question deleted');
    setDeleting(null);
    load();
  };

  const setOption = (i, val) => {
    const options = [...form.options];
    options[i] = val;
    setForm({ ...form, options });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Question Bank <span className="text-gray-light font-medium">({questions.length} questions)</span></h2>
          <p className="text-sm text-gray">Build a reusable pool of questions for your exams</p>
        </div>
        <button className="btn-primary sm:ml-auto" onClick={openAdd}><Plus className="h-4 w-4" /> Add Question</button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 text-gray-light absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions…" className="input !pl-9" />
        </div>
        <div className="flex gap-3 flex-wrap">
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="input !w-44">
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input !w-36">
            <option value="">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input !w-36">
            <option value="">All Types</option>
            <option value="MCQ">MCQ</option>
            <option value="TF">True/False</option>
            <option value="SA">Short Answer</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={3} />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<Database className="h-6 w-6 text-primary" />}
          title="No questions found"
          description="Start building your question bank. Add MCQ, True/False and Short Answer questions."
          action={<button className="btn-primary" onClick={openAdd}><Plus className="h-4 w-4" /> Add Question</button>}
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q._id} className="card p-5 hover:shadow-cardhover transition-shadow group">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-light">#{i + 1}</span>
                <Badge variant="info">{typeLabels[q.type]}</Badge>
                <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${difficultyStyles[q.difficulty]}`}>{q.difficulty}</span>
                <span className="text-xs font-medium text-primary-600 bg-primary-50 rounded-full px-2.5 py-0.5">{q.subject || 'General'}</span>
                {q.topic && <span className="text-xs text-gray bg-gray-100 rounded-full px-2.5 py-0.5">{q.topic}</span>}
                <span className="text-xs text-gray ml-auto">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(q)} className="p-1.5 text-gray-light hover:text-primary hover:bg-primary-50 rounded-control transition-colors" title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => duplicate(q)} className="p-1.5 text-gray-light hover:text-primary hover:bg-primary-50 rounded-control transition-colors" title="Duplicate"><Copy className="h-4 w-4" /></button>
                  <button onClick={() => setDeleting(q)} className="p-1.5 text-gray-light hover:text-danger hover:bg-danger/5 rounded-control transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="text-sm text-ink mt-3 leading-relaxed line-clamp-2">{q.question}</p>
              {q.type === 'MCQ' && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {q.options.map((o, oi) => (
                    <span key={oi} className={`text-xs px-2.5 py-1 rounded-md border ${o.isCorrect ? 'border-success/30 bg-success/10 text-success-dark font-medium' : 'border-line text-gray'}`}>
                      {String.fromCharCode(65 + oi)}. {o.text}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-light mt-3">Updated {timeAgo(q.updatedAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? 'Edit Question' : 'Add New Question'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDrawerOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Question'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {formError && <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-control px-3.5 py-3">{formError}</p>}

          <div>
            <label className="label">Question Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['MCQ', 'TF', 'SA'].map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t, correctAnswer: '', correctIndex: -1 })}
                  className={`py-2.5 rounded-control text-sm font-medium border transition-all ${form.type === t ? 'bg-primary-50 border-primary/40 text-primary-600' : 'border-line text-gray hover:border-primary/30'}`}
                >
                  {typeLabels[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Question</label>
            <textarea className="input !h-auto !py-3" rows={3} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Type the question text…" />
          </div>

          {form.type === 'MCQ' && (
            <div>
              <label className="label">Options <span className="normal-case text-gray-light">(click the circle to mark correct)</span></label>
              <div className="space-y-2.5">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, correctIndex: i })}
                      title="Mark as correct"
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${form.correctIndex === i ? 'border-success bg-success' : 'border-gray-300 hover:border-primary'}`}
                    >
                      {form.correctIndex === i && <span className="h-2 w-2 rounded-full bg-white" />}
                    </button>
                    <span className="text-xs font-semibold text-gray w-5">{String.fromCharCode(65 + i)}</span>
                    <input className="input" value={opt} onChange={(e) => setOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {form.type === 'TF' && (
            <div>
              <label className="label">Correct Answer</label>
              <div className="grid grid-cols-2 gap-2">
                {['true', 'false'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setForm({ ...form, correctAnswer: v })}
                    className={`py-2.5 rounded-control text-sm font-medium border transition-all capitalize ${form.correctAnswer === v ? 'bg-success/10 border-success/40 text-success-dark' : 'border-line text-gray hover:border-primary/30'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.type === 'SA' && (
            <div>
              <label className="label">Correct Answer</label>
              <input className="input" value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} placeholder="Expected answer" />
              <p className="text-xs text-gray mt-1.5">Answers are compared case-insensitively after trimming.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="label">Marks</label>
              <input type="number" min="0.5" step="0.5" className="input" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Subject</label>
              <input className="input" list="subject-list" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Physics" />
              <datalist id="subject-list">
                {subjects.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Topic / Tag</label>
              <input className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Electricity" />
            </div>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete this question?"
        message="The question will be removed from your bank. Exams already published are not affected."
      />
    </div>
  );
}
