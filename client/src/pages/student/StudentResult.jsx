import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2, XCircle, MinusCircle, Timer, ArrowLeft, Share2, Download, Trophy,
  Award, Lock,
} from 'lucide-react';
import client from '../../api/client.js';
import Badge from '../../components/Badge.jsx';
import Logo from '../../components/Logo.jsx';
import { PageLoader } from '../../components/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatTime, formatDateTime } from '../../utils/format.js';

export default function StudentResult() {
  const { attemptId } = useParams();
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await client.get(`/student/attempts/${attemptId}/result`);
      setResult(res.result);
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;
  if (!result) return null;

  const pct = result.totalMarks ? Math.round((result.score / result.totalMarks) * 100) : 0;
  const passed = result.passed;

  const breakdown = [
    { label: 'Correct', count: result.correctCount, color: 'text-success-dark', bg: 'bg-success/10', icon: <CheckCircle2 className="h-5 w-5 text-success" /> },
    { label: 'Wrong', count: result.wrongCount, color: 'text-danger', bg: 'bg-danger/10', icon: <XCircle className="h-5 w-5 text-danger" /> },
    { label: 'Skipped', count: result.skippedCount, color: 'text-gray', bg: 'bg-gray-100', icon: <MinusCircle className="h-5 w-5 text-gray" /> },
  ];

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Result link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const downloadCertificate = () => {
    if (!passed) return toast.error('Certificate is only available for passed exams');
    const canvas = document.createElement('canvas');
    canvas.width = 1123;
    canvas.height = 794;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1A56DB';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.font = 'bold 72px Georgia, serif';
    ctx.fillText('Certificate of Achievement', canvas.width / 2, 180);
    ctx.font = '28px Arial, sans-serif';
    ctx.fillStyle = '#6B7280';
    ctx.fillText('This certificate is proudly presented to', canvas.width / 2, 280);
    ctx.fillStyle = '#1A56DB';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText(result.studentName || 'Student', canvas.width / 2, 380);
    ctx.fillStyle = '#374151';
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText(`for passing "${result.examTitle}" with ${result.score} / ${result.totalMarks} marks (${pct}%)`, canvas.width / 2, 480);
    ctx.fillStyle = '#6B7280';
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText('ExamFlow · Online Exam Management Platform', canvas.width / 2, 620);
    ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, 670);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'certificate.png';
    a.click();
  };

  const reviewCount = result.review?.length || 0;

  return (
    <div className="min-h-screen bg-bglight">
      <header className="bg-white border-b border-line">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link to="/student"><Logo size={30} /></Link>
          <Link to="/student" className="ml-auto btn-ghost !py-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to exams
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Hero result card */}
        <div className={`card overflow-hidden ${passed ? 'border-success/30' : 'border-danger/30'}`}>
          <div className={`px-8 py-10 text-center ${passed ? 'bg-gradient-to-b from-success/5 to-white' : 'bg-gradient-to-b from-danger/5 to-white'}`}>
            <Badge variant={passed ? 'passed' : 'failed'} className="!text-sm !px-4 !py-1.5">
              {passed ? 'PASSED ✓' : 'FAILED ✗'}
            </Badge>
            <div className="mt-6 flex items-end justify-center gap-2">
              <span className="text-6xl font-extrabold tracking-tight text-ink leading-none">{result.score}</span>
              <span className="text-2xl font-semibold text-gray-light pb-1">/ {result.totalMarks}</span>
            </div>
            <p className="mt-3 text-lg font-medium text-ink">{pct}%</p>
            <p className="mt-2 text-sm text-gray">{result.examTitle}</p>

            <div className="mt-6 inline-flex items-center gap-2 text-sm text-gray bg-white border border-line rounded-full px-4 py-2">
              <Timer className="h-4 w-4" /> Time taken: {formatTime(result.timeTakenSec)}
              {result.passMark > 0 && <span className="text-gray-light">·</span>}
              {result.passMark > 0 && <span>Pass mark: {result.passMark}%</span>}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={share} className="btn-secondary">
                <Share2 className="h-4 w-4" /> Share Result
              </button>
              <button onClick={downloadCertificate} className={passed ? 'btn-primary' : 'btn-secondary'}>
                <Download className="h-4 w-4" /> Download Certificate
              </button>
            </div>
            {!passed && (
              <p className="mt-3 text-xs text-gray-light flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" /> Certificates are unlocked when you pass.
              </p>
            )}
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          {breakdown.map((b) => (
            <div key={b.label} className="card p-5 text-center">
              <div className={`h-10 w-10 rounded-xl ${b.bg} flex items-center justify-center mx-auto mb-3`}>{b.icon}</div>
              <p className={`text-2xl font-bold ${b.color}`}>{b.count}</p>
              <p className="text-xs text-gray mt-0.5 uppercase tracking-wide">{b.label}</p>
            </div>
          ))}
        </div>

        {/* Answer review */}
        {reviewCount > 0 && (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-ink">Answer Review</h2>
              {!result.showAnswers && <Badge variant="pending"><Lock className="h-3 w-3" /> Answers hidden until release</Badge>}
            </div>

            <div className="space-y-4">
              {result.review.map((r, i) => {
                const showCorrect = result.showAnswers;
                return (
                  <div key={i} className="card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="h-6 w-6 rounded-md bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-2.5 py-0.5">{r.type === 'MCQ' ? 'MCQ' : r.type === 'TF' ? 'True/False' : 'Short Answer'}</span>
                        <span className="text-xs text-gray">{r.marks} mk</span>
                      </div>
                      {showCorrect && (
                        r.isCorrect
                          ? <Badge variant="passed">Correct</Badge>
                          : r.skipped
                            ? <Badge variant="pending">Skipped</Badge>
                            : <Badge variant="failed">Wrong</Badge>
                      )}
                    </div>

                    <p className="text-sm text-ink mt-3 font-medium">{r.question}</p>

                    {showCorrect ? (
                      <div className="mt-4 space-y-2">
                        <div className={`flex items-center gap-2.5 p-3 rounded-control ${r.isCorrect ? 'bg-success/5 border border-success/20' : 'bg-danger/5 border border-danger/20'}`}>
                          <span className="text-xs font-semibold text-gray w-24 shrink-0">Your answer</span>
                          <span className="text-sm font-medium text-ink">
                            {r.type === 'MCQ'
                              ? r.selectedIndex !== null && r.selectedIndex !== undefined
                                ? `${String.fromCharCode(65 + r.selectedIndex)}. ${r.options[r.selectedIndex]?.text || ''}`
                                : 'No answer'
                              : r.type === 'TF'
                                ? r.textAnswer === 'true' ? 'True' : r.textAnswer === 'false' ? 'False' : 'No answer'
                                : r.textAnswer || 'No answer'}
                          </span>
                          {!r.skipped && (r.isCorrect ? <CheckCircle2 className="h-4 w-4 text-success ml-auto" /> : <XCircle className="h-4 w-4 text-danger ml-auto" />)}
                        </div>
                        {!r.isCorrect && (
                          <div className="flex items-center gap-2.5 p-3 rounded-control bg-success/5 border border-success/20">
                            <span className="text-xs font-semibold text-gray w-24 shrink-0">Correct</span>
                            <span className="text-sm font-medium text-success-dark">
                              {r.type === 'MCQ' ? `${String.fromCharCode(65 + r.options.findIndex((o) => o.isCorrect))}. ${r.options.find((o) => o.isCorrect)?.text || ''}` : String(r.correctAnswer)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-gray italic bg-gray-50 rounded-control p-3 border border-dashed border-line">
                        {result.reviewMode ? 'Review pending — answers will appear here after the instructor reviews.' : 'Your answers and the key are hidden by the instructor.'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-gray text-center">Submitted {result.attempt?.submittedAt ? formatDateTime(result.attempt.submittedAt) : ''} · ExamFlow</p>
      </main>
    </div>
  );
}
