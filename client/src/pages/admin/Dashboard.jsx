import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, FileText, Target, Award, TrendingUp, PlusCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import client from '../../api/client.js';
import StatCard from '../../components/StatCard.jsx';
import Badge from '../../components/Badge.jsx';
import Avatar from '../../components/Avatar.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { PageLoader } from '../../components/Spinner.jsx';
import { formatDate, formatDateTime, timeAgo, pct } from '../../utils/format.js';

function examStatus(exam) {
  const s = exam.computedStatus || exam.status;
  return {
    live: { label: 'Live', variant: 'live' },
    draft: { label: 'Draft', variant: 'draft' },
    completed: { label: 'Completed', variant: 'completed' },
  }[s] || { label: s, variant: 'neutral' };
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        client.get('/institute/dashboard-stats'),
        client.get('/institute/chart-data'),
      ]);
      setStats(s.stats);
      setChart(c.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: <Users className="h-5 w-5" />, trendLabel: `+${stats.newStudentsThisMonth} this month`, trendUp: true, iconBg: 'bg-primary-50 text-primary' },
    { label: 'Total Exams', value: stats.totalExams, icon: <FileText className="h-5 w-5" />, trendLabel: `${stats.liveExams} live now`, trendUp: true, iconBg: 'bg-warning/10 text-warning-dark' },
    { label: 'Avg Score', value: `${stats.avgScore}%`, icon: <Target className="h-5 w-5" />, trendLabel: '+3.2% vs last month', trendUp: true, iconBg: 'bg-success/10 text-success-dark' },
    { label: 'Pass Rate', value: `${stats.passRate}%`, icon: <Award className="h-5 w-5" />, trendLabel: `${stats.attempts} attempts graded`, trendUp: true, iconBg: 'bg-danger/10 text-danger-dark' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Line chart */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-ink">Exam Scores Over Time</h3>
              <p className="text-xs text-gray mt-0.5">Average score percentage · last 6 months</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-dark bg-success/10 rounded-full px-2.5 py-1">
              <TrendingUp className="h-3.5 w-3.5" /> Trending
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart.scoresOverTime} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="score" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1A56DB" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#1A56DB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Avg Score']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 13 }}
                />
                <Area type="monotone" dataKey="score" stroke="#1A56DB" strokeWidth={2.5} fill="url(#score)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-ink">Students by Batch</h3>
          <p className="text-xs text-gray mt-0.5">Distribution across your batches</p>
          <div className="h-64 mt-2">
            {chart.studentsByBatch.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart.studentsByBatch} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [v, 'Students']}
                    cursor={{ fill: '#EBF5FF' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 13 }}
                  />
                  <Bar dataKey="students" fill="#1A56DB" radius={[6, 6, 0, 0]} maxBarSize={46} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray mt-10 text-center">No batches yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Recent exams */}
        <div className="card overflow-hidden lg:col-span-3">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <div>
              <h3 className="font-semibold text-ink">Recent Exams</h3>
              <p className="text-xs text-gray mt-0.5">Latest activity across your exams</p>
            </div>
            <Link to="/admin/exams" className="btn-ghost !py-1.5 text-sm">View all</Link>
          </div>
          {chart.recentExams.length ? (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Exam Name</th>
                    <th>Date</th>
                    <th>Students</th>
                    <th>Avg Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.recentExams.map((exam) => {
                    const st = examStatus(exam);
                    return (
                      <tr key={exam._id}>
                        <td>
                          <Link to={`/admin/exams/${exam._id}/edit`} className="font-medium text-ink hover:text-primary transition-colors">{exam.title}</Link>
                          <p className="text-xs text-gray">{exam.subject || 'General'}</p>
                        </td>
                        <td className="text-sm text-gray whitespace-nowrap">{formatDateTime(exam.startAt)}</td>
                        <td className="text-sm text-ink font-medium">{exam.attempts}</td>
                        <td className="text-sm text-ink font-medium">{exam.avgScore === null ? '—' : `${exam.avgScore}%`}</td>
                        <td><Badge variant={st.variant}>{st.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="h-6 w-6 text-primary" />}
              title="No exams yet"
              description="Create your first exam and start testing your students."
              action={<Link to="/admin/exams/new" className="btn-primary"><PlusCircle className="h-4 w-4" /> New Exam</Link>}
            />
          )}
        </div>

        {/* Top students */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-line">
            <h3 className="font-semibold text-ink">Top Performing Students</h3>
            <p className="text-xs text-gray mt-0.5">Best scores across all exams</p>
          </div>
          {chart.topPerforming.length ? (
            <ul className="divide-y divide-line">
              {chart.topPerforming.map(({ student, score, total, pct: p }, i) => (
                <li key={student._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <span className="w-6 text-center text-sm font-bold text-gray-light">#{i + 1}</span>
                  <Avatar name={student.name} color={student.avatarColor} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{student.name}</p>
                    <p className="text-xs text-gray">{student.batch?.name || 'No batch'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink">{score}<span className="text-gray-light font-normal">/{total}</span></p>
                    <p className="text-xs font-medium text-success-dark">{p}%</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray text-center py-12">No graded attempts yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
