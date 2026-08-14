import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Clock, ArrowRight, Megaphone, Timer, CalendarDays, Lock } from 'lucide-react';
import client from '../../api/client.js';
import Badge from '../../components/Badge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { PageLoader } from '../../components/Spinner.jsx';
import { formatDateTime, formatClock } from '../../utils/format.js';

export default function StudentHome() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [e, a] = await Promise.all([
        client.get('/student/exams'),
        client.get('/student/announcements'),
      ]);
      setExams(e.exams);
      setAnnouncements(a.announcements);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;

  const startExam = (exam) => navigate(`/exam/${exam._id}`);

  return (
    <div className="space-y-6">
      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-sm font-semibold text-gray flex items-center gap-2 uppercase tracking-wide">
            <Megaphone className="h-4 w-4 text-primary" /> Announcements
          </h3>
          <div className="space-y-2">
            {announcements.slice(0, 3).map((a) => (
              <div key={a._id} className="card p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center shrink-0">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{a.title}</p>
                  <p className="text-sm text-gray mt-0.5 leading-relaxed">{a.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray flex items-center gap-2 uppercase tracking-wide mb-3">
          <FileText className="h-4 w-4 text-primary" /> Available Exams
        </h3>

        {exams.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6 text-primary" />}
            title="No exams available right now"
            description="When your institute publishes an exam, it will appear here."
          />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {exams.map((exam) => {
              const answeredCount = exam.attempt?.answers?.length || 0;
              return (
                <div key={exam._id} className="card p-5 hover:shadow-cardhover transition-shadow flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={exam.completed ? 'completed' : exam.started ? 'pending' : exam.ended ? 'completed' : 'live'}>
                      {exam.completed ? 'Completed' : exam.started ? 'In Progress' : exam.ended ? 'Ended' : 'Available'}
                    </Badge>
                    <span className="text-xs text-gray flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {exam.duration} min</span>
                  </div>
                  <h4 className="font-semibold text-ink leading-snug">{exam.title}</h4>
                  <p className="text-xs text-gray mt-1">{exam.subject || 'General'}{exam.batch ? ` · ${exam.batch.name}` : ''}</p>
                  <div className="mt-3 flex items-center text-xs text-gray gap-4">
                    <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> {exam.questions?.length || 0} questions</span>
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDateTime(exam.startAt)}</span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
                    <span className="text-xs text-gray">
                      {exam.completed
                        ? `${exam.attempt.score}/${exam.attempt.totalMarks} marks`
                        : exam.started
                          ? `Attempt ${exam.attemptsUsed} of ${exam.maxAttempts}`
                          : exam.notStarted
                            ? 'Starts ' + formatDateTime(exam.startAt)
                            : `Attempt ${exam.attemptsUsed + 1} of ${exam.maxAttempts}`}
                    </span>
                    {exam.started ? (
                      <button onClick={() => startExam(exam)} className="btn-primary !py-1.5 !text-xs">
                        Continue <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : exam.completed ? (
                      <Link to={`/result/${exam.attempt._id}`} className="btn-secondary !py-1.5 !text-xs">View Result</Link>
                    ) : exam.canStart && !exam.notStarted && !exam.ended ? (
                      <button onClick={() => startExam(exam)} className="btn-primary !py-1.5 !text-xs">
                        Start Exam <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-light inline-flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5" /> {exam.ended ? 'Closed' : 'Not started'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
