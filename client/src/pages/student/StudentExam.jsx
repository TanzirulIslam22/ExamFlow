import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Bookmark, Send, CheckCircle2, Clock, Loader2,
} from 'lucide-react';
import client from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from '../../components/Logo.jsx';
import { formatClock } from '../../utils/format.js';

export default function StudentExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submitRef = useRef(submitting);
  submitRef.current = submitting;

  const storageKey = `examflow_attempt_${id}`;

  const load = useCallback(async () => {
    try {
      const res = await client.get(`/student/exams/${id}`);
      setExam(res.exam);
      setQuestions(res.questions);
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setAnswers(saved.answers || {});
      setBookmarks(saved.bookmarks || {});
      const startedAt = new Date(res.attempt.startedAt).getTime();
      const remaining = Math.max(0, startedAt + res.exam.duration * 60000 - Date.now());
      setSecondsLeft(Math.floor(remaining / 1000));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, storageKey]);

  useEffect(() => { load(); }, [load]);

  // persist answers + autosave indicator
  useEffect(() => {
    if (!exam) return;
    const t = setInterval(() => {
      localStorage.setItem(storageKey, JSON.stringify({ answers: answersRef.current, bookmarks }));
    }, 1000);
    return () => clearInterval(t);
  }, [exam, storageKey, bookmarks]);

  // timer
  useEffect(() => {
    if (!exam || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submitAttempt();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam]);

  const setAnswer = (questionId, value) => {
    setAnswers((a) => ({ ...a, [questionId]: value }));
  };

  const toggleBookmark = (questionId) => {
    setBookmarks((b) => {
      const next = { ...b, [questionId]: !b[questionId] };
      localStorage.setItem(storageKey, JSON.stringify({ answers: answersRef.current, bookmarks: next }));
      return next;
    });
  };

  const answeredCount = questions.filter((q) => {
    const a = answers[q._id];
    if (q.type === 'MCQ') return a !== undefined && a !== null && a !== '';
    return typeof a === 'string' && a.trim() !== '';
  }).length;

  const submitAttempt = useCallback(async () => {
    if (submitRef.current || !exam || !questions.length) return;
    submitRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        answers: questions.map((q) => ({
          questionId: q._id,
          selectedIndex: q.type === 'MCQ' ? answersRef.current[q._id] ?? null : undefined,
          textAnswer: q.type === 'MCQ' ? undefined : answersRef.current[q._id] || '',
        })),
        questionOrder: questions.map((q) => q._id),
      };
      const res = await client.post(`/student/exams/${id}/attempt`, payload);
      localStorage.removeItem(storageKey);
      navigate(`/result/${res.attemptId}`, { replace: true });
    } catch (e) {
      toast.error(e.message || 'Failed to submit. Your answers are saved.');
      submitRef.current = false;
      setSubmitting(false);
    }
  }, [exam, questions, id, storageKey, navigate, toast]);

  const confirmSubmit = () => {
    if (answeredCount === 0) return toast.error('Answer at least one question before submitting');
    if (window.confirm(`Submit exam? ${answeredCount} of ${questions.length} questions answered.`)) {
      submitAttempt();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bglight flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bglight flex items-center justify-center p-6">
        <div className="card p-8 text-center max-w-md">
          <h2 className="text-lg font-bold text-ink">Cannot start exam</h2>
          <p className="text-sm text-gray mt-2">{error}</p>
          <Link to="/student" className="btn-primary mt-6">Back to My Exams</Link>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const isMCQ = q.type === 'MCQ';
  const isTF = q.type === 'TF';
  const selected = answers[q._id];
  const timeLow = secondsLeft < 300;
  const progressPct = questions.length ? (answeredCount / questions.length) * 100 : 0;

  const navColor = (qi) => {
    const qid = questions[qi]._id;
    if (bookmarks[qid]) return 'bg-warning text-white border-warning';
    if (qi === current) return 'bg-primary text-white border-primary ring-2 ring-primary/30';
    const a = answers[qid];
    const has = isAnswered(questions[qi], a);
    return has ? 'bg-primary-50 text-primary-600 border-primary/40' : 'bg-white text-gray border-line';
  };

  function isAnswered(qq, a) {
    if (qq.type === 'MCQ') return a !== undefined && a !== null;
    return typeof a === 'string' && a.trim() !== '';
  }

  return (
    <div className="min-h-screen bg-bglight flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-line h-16 flex items-center gap-4 px-4 lg:px-6">
        <Logo size={30} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink truncate">{exam.title}</p>
          <p className="text-xs text-gray">{user?.name}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border font-mono text-base font-bold ${timeLow ? 'bg-danger/10 border-danger/30 text-danger animate-pulseSoft' : 'bg-gray-50 border-line text-ink'}`}>
          <Clock className="h-4 w-4" />
          {formatClock(secondsLeft)}
        </div>
        <button
          onClick={confirmSubmit}
          disabled={submitting || answeredCount === 0}
          className="btn-primary"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit
        </button>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full transition-all duration-500 ${timeLow ? 'bg-warning' : 'bg-primary'}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main area */}
        <main className="flex-1 min-w-0 p-4 lg:p-8 flex justify-center">
          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-medium text-gray">
                Question <span className="text-ink font-bold">{current + 1}</span> of {questions.length}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray font-medium">{answeredCount} answered</span>
                <button
                  onClick={() => toggleBookmark(q._id)}
                  className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${bookmarks[q._id] ? 'bg-warning/10 border-warning/40 text-warning-dark' : 'border-line text-gray hover:border-warning/50'}`}
                >
                  <Bookmark className={`h-4 w-4 ${bookmarks[q._id] ? 'fill-warning text-warning' : ''}`} />
                  {bookmarks[q._id] ? 'Bookmarked' : 'Bookmark'}
                </button>
              </div>
            </div>

            <div className="card p-6 lg:p-8 animate-slideUp" key={current}>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xs font-semibold text-primary-600 bg-primary-50 rounded-full px-2.5 py-1">
                  {q.type === 'MCQ' ? 'Multiple Choice' : q.type === 'TF' ? 'True or False' : 'Short Answer'}
                </span>
                <span className="text-xs text-gray">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
              </div>
              <h2 className="text-lg lg:text-xl font-semibold text-ink leading-relaxed">{q.question}</h2>

              <div className="mt-7">
                {isMCQ && (
                  <div className="space-y-3">
                    {q.options.map((opt, i) => {
                      const active = selected === i;
                      return (
                        <button
                          key={i}
                          onClick={() => setAnswer(q._id, i)}
                          className={`w-full flex items-center gap-3.5 p-4 rounded-card border-2 text-left transition-all ${active ? 'border-primary bg-primary-50' : 'border-line hover:border-primary/40 bg-white'}`}
                        >
                          <span className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${active ? 'border-primary bg-primary text-white' : 'border-gray-300 text-transparent'}`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className={`text-sm font-medium ${active ? 'text-primary-600' : 'text-ink'}`}>{opt.text}</span>
                          {active && <CheckCircle2 className="h-5 w-5 text-primary ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {isTF && (
                  <div className="grid grid-cols-2 gap-4">
                    {['true', 'false'].map((v) => {
                      const active = selected === v;
                      return (
                        <button
                          key={v}
                          onClick={() => setAnswer(q._id, v)}
                          className={`py-6 rounded-card border-2 text-base font-semibold transition-all ${active ? v === 'true' ? 'border-success bg-success/10 text-success-dark' : 'border-danger bg-danger/10 text-danger' : 'border-line hover:border-primary/40'}`}
                        >
                          {v === 'true' ? '✓ True' : '✗ False'}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'SA' && (
                  <div>
                    <textarea
                      value={typeof selected === 'string' ? selected : ''}
                      onChange={(e) => setAnswer(q._id, e.target.value)}
                      rows={4}
                      placeholder="Type your answer here…"
                      className="input !h-auto !py-3.5 !text-base"
                    />
                    <p className="text-xs text-gray mt-2">Short answers are compared against the expected answer. Keep it brief.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-5">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="btn-secondary disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              {current < questions.length - 1 ? (
                <button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} className="btn-primary">
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={confirmSubmit} className="btn-primary" disabled={submitting || answeredCount === 0}>
                  <Send className="h-4 w-4" /> Submit Exam
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Navigator sidebar */}
        <aside className="w-full lg:w-72 bg-white border-t lg:border-t-0 lg:border-l border-line p-5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink text-sm">Question Navigator</h3>
            <span className="text-xs text-gray">{answeredCount}/{questions.length}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((qq, i) => (
              <button
                key={qq._id}
                onClick={() => setCurrent(i)}
                className={`h-10 rounded-lg border text-sm font-semibold transition-all ${navColor(i)}`}
                title={`Question ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-2 text-xs text-gray">
            <p className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-primary-50 border border-primary/40" /> Answered</p>
            <p className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-warning border border-warning" /> Bookmarked</p>
            <p className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-white border border-line" /> Unanswered</p>
          </div>
        </aside>
      </div>

      {/* Bottom hint bar */}
      <footer className="bg-white border-t border-line px-6 py-3 text-center">
        <p className="text-xs text-gray-light flex items-center justify-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Your answers are auto-saved every few seconds. Do not close this tab.
        </p>
      </footer>
    </div>
  );
}
