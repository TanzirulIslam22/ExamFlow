import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight } from 'lucide-react';
import client from '../../api/client.js';
import Badge from '../../components/Badge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { PageLoader } from '../../components/Spinner.jsx';
import { formatDate, formatTime } from '../../utils/format.js';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await client.get('/student/results');
      setResults(res.results);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">My Results</h2>
        <p className="text-sm text-gray">Your past exam performance at a glance</p>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-6 w-6 text-primary" />}
          title="No results yet"
          description="Take an exam and your results will show up here."
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map((r) => (
            <div key={r._id} className="card p-5 hover:shadow-cardhover transition-shadow flex flex-col">
              <div className="flex items-center justify-between">
                <Badge variant={r.passed ? 'passed' : 'failed'}>{r.passed ? 'PASSED' : 'FAILED'}</Badge>
                <span className="text-xs text-gray">{formatDate(r.submittedAt)}</span>
              </div>
              <h4 className="font-semibold text-ink mt-3">{r.exam?.title}</h4>
              <p className="text-xs text-gray mt-0.5">{r.exam?.subject || 'General'}</p>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-ink">
                    {r.pct}<span className="text-base text-gray-light">%</span>
                  </p>
                  <p className="text-xs text-gray mt-0.5">{r.score} / {r.totalMarks} marks · {formatTime(r.timeTakenSec)}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
                <div className="flex gap-3 text-xs">
                  <span className="text-success-dark font-medium">{r.correctCount} correct</span>
                  <span className="text-danger font-medium">{r.wrongCount !== undefined ? r.wrongCount : '—'} wrong</span>
                </div>
                <Link to={`/result/${r._id}`} className="btn-secondary !py-1.5 !text-xs">
                  Details <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
