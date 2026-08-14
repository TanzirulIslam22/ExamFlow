import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Search, Save, Rocket, ListFilter,
  Clock, CalendarDays, Percent, RefreshCw, Users, Eye, CheckCircle2, FileText,
} from 'lucide-react';
import client from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import Badge from '../../components/Badge.jsx';
import { PageLoader } from '../../components/Spinner.jsx';
import { difficultyStyles, typeLabels } from '../../utils/format.js';

function SettingsField({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" /> {label}</label>
      {children}
    </div>
  );
}

export default function ExamBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [form, setForm] = useState({
    title: '', subject: '', description: '', duration: 30,
    startAt: '', endAt: '', passMark: 40, maxAttempts: 1, randomize: false,
    accessType: 'open', batch: '', showResults: 'immediate',
  });
  const [added, setAdded] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('questions');
  const dragOverIndex = useRef(null);

  const load = useCallback(async () => {
    try {
      const [bank, meta, batchRes] = await Promise.all([
        client.get('/questions', { params: { limit: 200 } }),
        client.get('/questions/meta'),
        client.get('/batches'),
      ]);
      setQuestions(bank.questions);
      setSubjects(meta.subjects);
      setBatches(batchRes.batches);

      if (isEdit) {
        const res = await client.get(`/exams/${id}`);
        const e = res.exam;
        setExam(e);
        setForm({
          title: e.title, subject: e.subject || '', description: e.description || '',
          duration: e.duration, startAt: e.startAt ? new Date(e.startAt).toISOString().slice(0, 16) : '',
          endAt: e.endAt ? new Date(e.endAt).toISOString().slice(0, 16) : '',
          passMark: e.passMark, maxAttempts: e.maxAttempts, randomize: e.randomize,
          accessType: e.accessType, batch: e.batch?._id || '', showResults: e.showResults,
        });
        setAdded(
          e.questions.map((q) => ({ questionId: q.questionId, marks: q.marks, question: bank.questions.find((x) => x._id === q.questionId) }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => { load(); }, [load]);

  const bankQuestions = questions.filter((q) => {
    const already = added.some((a) => a.questionId === q._id);
    if (already) return false;
    if (subjectFilter && q.subject !== subjectFilter) return false;
    if (search.trim() && !q.question.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalMarks = added.reduce((s, a) => s + (Number(a.marks) || 1), 0);

  const addQuestion = (q) => {
    setAdded((a) => [...a, { questionId: q._id, marks: q.marks || 1, question: q }]);
  };

  const removeQuestion = (i) => {
    setAdded((a) => a.filter((_, idx) => idx !== i));
  };

  const setMarks = (i, val) => {
    setAdded((a) => a.map((item, idx) => (idx === i ? { ...item, marks: val } : item)));
  };

  const onDrop = () => {
    if (dragIndex !== null && dragOverIndex.current !== null && dragIndex !== dragOverIndex.current) {
      setAdded((a) => {
        const copy = [...a];
        const [moved] = copy.splice(dragIndex, 1);
        copy.splice(dragOverIndex.current, 0, moved);
        return copy;
      });
    }
    setDragIndex(null);
    dragOverIndex.current = null;
  };

  const saveDraft = async () => {
    if (!form.title.trim()) return toast.error('Give your exam a title first');
    setSaving(true);
    try {
      let examId = id;
      if (isEdit) {
        await client.put(`/exams/${id}`, form);
      } else {
        const res = await client.post('/exams', form);
        examId = res.exam._id;
      }
      // Sync question list
      await client.post(`/exams/${examId}/questions`, { questionIds: added.map((a) => a.questionId) });
      // Remove questions that were deleted from canvas
      const current = await client.get(`/exams/${examId}`);
      const currentIds = current.exam.questions.map((q) => String(q.questionId));
      const keep = new Set(added.map((a) => a.questionId));
      for (let i = current.exam.questions.length - 1; i >= 0; i--) {
        if (!keep.has(String(current.exam.questions[i].questionId))) {
          await client.delete(`/exams/${examId}/questions/${i}`);
        }
      }
      // Sync marks
      const updated = await client.get(`/exams/${examId}`);
      for (let i = 0; i < added.length; i++) {
        const existing = updated.exam.questions.find((q, qi) => {
          return String(q.questionId) === String(added[i].questionId) && Number(q.marks) !== Number(added[i].marks);
        });
        if (existing) await client.put(`/exams/${examId}/questions/${i}`, { marks: Number(added[i].marks) || 1 });
      }

      toast.success('Exam saved');
      if (!isEdit) navigate(`/admin/exams/${examId}/edit`, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!form.title.trim()) return toast.error('Give your exam a title first');
    if (added.length === 0) return toast.error('Add at least one question before publishing');
    await saveDraft();
    setPublishing(true);
    try {
      const examId = id || (await client.get('/exams', { params: { search: form.title } })).exams[0]?._id;
      if (!examId) return toast.error('Could not find the exam');
      await client.post(`/exams/${examId}/publish`);
      toast.success('Exam published! Students can now take it.');
      navigate('/admin/exams');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <PageLoader />;

  const tabs = [
    { id: 'questions', label: 'Questions', icon: FileText },
    { id: 'settings', label: 'Settings', icon: ListFilter },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/exams')} className="btn-ghost !p-2"><ArrowLeft className="h-4 w-4" /></button>
        <div className="flex-1 min-w-0">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Untitled Exam — enter a title…"
            className="text-xl font-bold tracking-tight text-ink bg-transparent w-full focus:outline-none placeholder:text-gray-light"
          />
          <p className="text-xs text-gray">Draft exam · {added.length} questions · {totalMarks} total marks</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={saveDraft} disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button className="btn-primary" onClick={publish} disabled={publishing}>
            <Rocket className="h-4 w-4" /> {publishing ? 'Publishing…' : 'Publish Exam'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-line">
        {tabs.map(({ id: t, label, icon: Icon }) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === t ? 'border-primary text-primary-600' : 'border-transparent text-gray hover:text-ink'}`}
          >
            <Icon className="h-4 w-4" /> {label}
            {t === 'questions' && <Badge variant="info">{added.length}</Badge>}
          </button>
        ))}
      </div>

      {activeTab === 'questions' ? (
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          {/* Question bank panel */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-line">
              <h3 className="font-semibold text-ink">Question Bank</h3>
              <p className="text-xs text-gray mt-0.5">Search and add questions to your exam</p>
              <div className="relative mt-3">
                <Search className="h-4 w-4 text-gray-light absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bank…" className="input !pl-9" />
              </div>
              <div className="flex gap-2 mt-2.5">
                <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="input !w-44 !h-9">
                  <option value="">All Subjects</option>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="max-h-[560px] overflow-y-auto divide-y divide-line">
              {bankQuestions.length === 0 && (
                <p className="text-sm text-gray text-center py-10">No more questions to add{search ? ' for this search' : ''}.</p>
              )}
              {bankQuestions.map((q) => (
                <div key={q._id} className="px-4 py-3.5 flex items-start gap-3 hover:bg-gray-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="info">{typeLabels[q.type]}</Badge>
                      <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${difficultyStyles[q.difficulty]}`}>{q.difficulty}</span>
                      {q.subject && <span className="text-[11px] text-gray bg-gray-100 rounded-full px-2 py-0.5">{q.subject}</span>}
                      <span className="text-[11px] text-gray ml-auto">{q.marks} mk</span>
                    </div>
                    <p className="text-sm text-ink mt-1.5 line-clamp-2">{q.question}</p>
                  </div>
                  <button onClick={() => addQuestion(q)} title="Add to exam"
                    className="shrink-0 h-8 w-8 rounded-control border border-primary/30 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Exam canvas */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-ink">Exam Canvas</h3>
                <p className="text-xs text-gray mt-0.5">Drag to reorder · {totalMarks} total marks</p>
              </div>
              <Badge variant="info">{added.length} questions</Badge>
            </div>
            {added.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="h-14 w-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold text-ink">Canvas is empty</p>
                <p className="text-sm text-gray mt-1">Add questions from the bank to build your exam.</p>
              </div>
            ) : (
              <div className="max-h-[560px] overflow-y-auto p-3 space-y-2.5">
                {added.map((item, i) => (
                  <div
                    key={`${item.questionId}-${i}`}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => { e.preventDefault(); dragOverIndex.current = i; }}
                    onDrop={onDrop}
                    onDragEnd={() => { setDragIndex(null); dragOverIndex.current = null; }}
                    className={`flex items-start gap-3 p-3.5 rounded-card border transition-all ${dragIndex === i ? 'border-primary/50 bg-primary-50 shadow-card' : 'border-line bg-white hover:border-primary/30'}`}
                  >
                    <button className="cursor-grab active:cursor-grabbing text-gray-light mt-1.5 hover:text-primary"><GripVertical className="h-4 w-4" /></button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-md bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <Badge variant="info">{typeLabels[item.question.type]}</Badge>
                        <span className={`text-[11px] rounded-full px-2 py-0.5 ${difficultyStyles[item.question.difficulty]}`}>{item.question.difficulty}</span>
                      </div>
                      <p className="text-sm text-ink mt-1.5 line-clamp-2">{item.question.question}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20">
                        <div className="relative">
                          <input
                            type="number" min="0.5" step="0.5" value={item.marks}
                            onChange={(e) => setMarks(i, e.target.value)}
                            className="input !h-9 !pr-7 !text-center"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-light">mk</span>
                        </div>
                      </div>
                      <button onClick={() => removeQuestion(i)} className="p-2 text-gray-light hover:text-danger hover:bg-danger/5 rounded-control transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Settings */
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          <div className="card p-6 space-y-5">
            <div>
              <h3 className="font-semibold text-ink mb-4">General</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <SettingsField label="Duration (minutes)" icon={Clock}>
                    <input type="number" min="1" className="input" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                  </SettingsField>
                  <SettingsField label="Pass Mark (%)" icon={Percent}>
                    <input type="number" min="0" max="100" className="input" value={form.passMark} onChange={(e) => setForm({ ...form, passMark: e.target.value })} />
                  </SettingsField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SettingsField label="Start Date & Time" icon={CalendarDays}>
                    <input type="datetime-local" className="input" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
                  </SettingsField>
                  <SettingsField label="End Date & Time" icon={CalendarDays}>
                    <input type="datetime-local" className="input" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
                  </SettingsField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Subject</label>
                    <input className="input" list="subject-list" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Science" />
                    <datalist id="subject-list">
                      {subjects.map((s) => <option key={s} value={s} />)}
                    </datalist>
                  </div>
                  <SettingsField label="Max Attempts" icon={RefreshCw}>
                    <input type="number" min="1" className="input" value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })} />
                  </SettingsField>
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea className="input !h-auto !py-2.5" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Instructions shown to students…" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-semibold text-ink mb-4">Access Control</h3>
              <div className="space-y-2.5">
                {[
                  { id: 'open', label: 'Open Link', desc: 'Any student can take the exam' },
                  { id: 'batch', label: 'Batch Specific', desc: 'Only students in the selected batch' },
                  { id: 'invite', label: 'Invite Only', desc: 'Only students you invite (link-based)' },
                ].map((opt) => (
                  <label key={opt.id} className={`flex items-start gap-3 p-3.5 rounded-control border cursor-pointer transition-all ${form.accessType === opt.id ? 'border-primary/40 bg-primary-50' : 'border-line hover:border-primary/30'}`}>
                    <input
                      type="radio" name="access" className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                      checked={form.accessType === opt.id} onChange={() => setForm({ ...form, accessType: opt.id })}
                    />
                    <div>
                      <p className="text-sm font-medium text-ink">{opt.label}</p>
                      <p className="text-xs text-gray mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {form.accessType === 'batch' && (
                <div className="mt-4">
                  <label className="label flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Select Batch</label>
                  <select className="input" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })}>
                    <option value="">Choose a batch…</option>
                    {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-ink mb-4">Behaviour</h3>
              <label className="flex items-center justify-between p-3.5 rounded-control border border-line cursor-pointer hover:border-primary/30 transition-all">
                <div>
                  <p className="text-sm font-medium text-ink">Randomize questions</p>
                  <p className="text-xs text-gray mt-0.5">Shuffle question order for each student</p>
                </div>
                <button
                  type="button" role="switch" aria-checked={form.randomize}
                  onClick={() => setForm({ ...form, randomize: !form.randomize })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${form.randomize ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.randomize ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </label>
              <div className="mt-4">
                <label className="label flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Show Results</label>
                <select className="input" value={form.showResults} onChange={(e) => setForm({ ...form, showResults: e.target.value })}>
                  <option value="immediate">Immediately after submission</option>
                  <option value="review">Score now, answers after review</option>
                  <option value="manual">Manual release</option>
                </select>
                <p className="text-xs text-gray mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Auto-grading applies to MCQ and True/False.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
