import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3, Download, Users, Target, Award, TrendingUp, Timer, PieChart, ListChecks,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart as RePie, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import client from '../../api/client.js';
import StatCard from '../../components/StatCard.jsx';
import Badge from '../../components/Badge.jsx';
import Avatar from '../../components/Avatar.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { PageLoader } from '../../components/Spinner.jsx';
import { formatTime, formatDate } from '../../utils/format.js';

const DIFF = ['#0E9F6E', '#F59E0B', '#EF4444', '#1A56DB', '#8B5CF6', '#06B6D4'];
const PASS_COLORS = ['#0E9F6E', '#FCA5A5'];

export default function Reports() {
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [examId, setExamId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [overview, setOverview] = useState(null);
  const [examDetail, setExamDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (examId) params.examId = examId;
      if (batchId) params.batchId = batchId;
      const [ov, ex, b] = await Promise.all([
        client.get('/analytics/overview', { params }),
        client.get('/analytics/exams'),
        client.get('/analytics/batches'),
      ]);
      setOverview(ov);
      setExams(ex.exams);
      setBatches(b.batches);
    } finally {
      setLoading(false);
    }
  }, [examId, batchId]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  useEffect(() => {
    if (!examId) return setExamDetail(null);
    setDetailLoading(true);
    client.get(`/analytics/exam/${examId}`)
      .then((r) => setExamDetail(r))
      .catch(() => setExamDetail(null))
      .finally(() => setDetailLoading(false));
  }, [examId]);

  const exportCsv = async (scope) => {
    try {
      const params = {};
      if (scope) params.examId = scope;
      const res = await client.get('/analytics/export', { params, responseType: 'blob' });
      const url = URL.createObjectURL(res);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'examflow-results.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* interceptor surfaces error */
    }
  };

  if (loading) return <PageLoader />;

  const donutData = [
    { name: 'Passed', value: overview.passFail.passed },
    { name: 'Failed', value: overview.passFail.failed },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="label">Exam</label>
          <select className="input" value={examId} onChange={(e) => setExamId(e.target.value)}>
            <option value="">All exams</option>
            {exams.map((e) => (
              <option key={e._id} value={e._id}>{e.title} ({e.attempts} attempts)</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="label">Batch</label>
          <select className="input" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">All batches</option>
            {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2.5">
          <button className="btn-secondary" onClick={() => exportCsv(examId || undefined)}>
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Attempts" value={overview.kpis.totalAttempts} icon={<Users className="h-5 w-5" />} iconBg="bg-primary-50 text-primary" />
        <StatCard label="Average Score" value={`${overview.kpis.avgScore}%`} icon={<Target className="h-5 w-5" />} iconBg="bg-warning/10 text-warning-dark" />
        <StatCard label="Pass Rate" value={`${overview.kpis.passRate}%`} icon={<Award className="h-5 w-5" />} iconBg="bg-success/10 text-success-dark" />
        <StatCard label="Highest Score" value={`${overview.kpis.highestScore}%`} icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-danger/10 text-danger-dark" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Distribution histogram */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink">Score Distribution</h3>
          <p className="text-xs text-gray mt-0.5">How students scored, grouped by 10% buckets</p>
          <div className="h-60 mt-4">
            {overview.distribution.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.distribution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#EBF5FF' }} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 13 }} />
                  <Bar dataKey="count" fill="#1A56DB" radius={[5, 5, 0, 0]} maxBarSize={34} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray text-center mt-16">No attempts for this filter</p>
            )}
          </div>
        </div>

        {/* Pass/fail donut */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink">Pass vs Fail</h3>
          <p className="text-xs text-gray mt-0.5">Outcome of all submitted attempts</p>
          <div className="h-60 mt-4 flex items-center justify-center">
            {donutData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePie>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="85%" paddingAngle={4}>
                    {donutData.map((_, i) => <Cell key={i} fill={PASS_COLORS[i % PASS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 13 }} />
                  <Legend formatter={(v) => <span className="text-sm text-ink font-medium">{v}</span>} />
                </RePie>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray">No attempts for this filter</p>
            )}
          </div>
        </div>
      </div>

      {/* Question difficulty analysis */}
      {examDetail && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
              <ListChecks className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-ink">Question Difficulty Analysis</h3>
              <p className="text-xs text-gray">"{examDetail.exam.title}" — hardest questions first</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Q#</th>
                  <th>Question</th>
                  <th>Correct %</th>
                  <th>Wrong %</th>
                  <th>Difficulty</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {examDetail.perQuestion.map((q) => (
                  <tr key={q.questionId}>
                    <td className="text-sm font-bold text-gray-light">#{q.index}</td>
                    <td className="text-sm text-ink max-w-sm"><span className="line-clamp-1">{q.preview}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-success rounded-full" style={{ width: `${q.correctPct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-success-dark">{q.correctPct}%</span>
                      </div>
                    </td>
                    <td className="text-xs font-medium text-danger">{q.wrongPct}%</td>
                    <td><Badge variant={q.difficulty === 'easy' ? 'active' : q.difficulty === 'medium' ? 'pending' : 'suspended'}>{q.difficulty}</Badge></td>
                    <td className="text-sm text-gray">{q.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student performance */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-ink">Student Performance</h3>
            <p className="text-xs text-gray mt-0.5">{examDetail ? `Results for "${examDetail.exam.title}"` : 'All attempts — ranked by score'}</p>
          </div>
          <button className="btn-secondary !py-1.5 !text-xs" onClick={() => exportCsv(examId || undefined)}>
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
        {examDetail && !detailLoading && examDetail.ranking.length === 0 ? (
          <EmptyState icon={<BarChart3 className="h-6 w-6 text-primary" />} title="No submissions yet" description="This exam has no submitted attempts yet." />
        ) : !examDetail ? (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Rank</th><th>Student</th><th>Batch</th><th>Score</th><th>Time</th><th>Result</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={6} className="text-center text-sm text-gray py-10">Select an exam to see ranked results, or export all attempts as CSV.</td></tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Rank</th><th>Student</th><th>Batch</th><th>Score</th><th>Percentage</th><th>Time</th><th>Result</th>
                </tr>
              </thead>
              <tbody>
                {examDetail.ranking.map((r) => (
                  <tr key={`${r.student}-${r.rank}`}>
                    <td>
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${r.rank <= 3 ? 'bg-warning/15 text-warning-dark' : 'bg-gray-100 text-gray'}`}>
                        {r.rank}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.student} color={r.avatarColor} size={34} />
                        <div>
                          <p className="text-sm font-medium text-ink">{r.student}</p>
                          <p className="text-xs text-gray">{r.studentId || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-gray">{r.batch || '—'}</td>
                    <td className="text-sm font-semibold text-ink">{r.score}<span className="text-gray-light font-normal">/{r.totalMarks}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${r.passed ? 'bg-success' : 'bg-danger'}`} style={{ width: `${r.pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray">{r.pct}%</span>
                      </div>
                    </td>
                    <td className="text-sm text-gray"><span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" />{formatTime(r.timeTakenSec)}</span></td>
                    <td><Badge variant={r.passed ? 'passed' : 'failed'}>{r.passed ? 'PASSED' : 'FAILED'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray flex items-center gap-1.5"><PieChart className="h-3.5 w-3.5" /> Analytics update in real time as students submit attempts.</p>
    </div>
  );
}
