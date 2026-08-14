import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  FilePlus2, Users, Zap, BarChart3, Lock, FileDown, Check, ArrowRight,
  PlayCircle, Menu, X, GraduationCap, Award, ClipboardList,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';

const features = [
  { icon: FilePlus2, title: 'Easy Exam Builder', desc: 'Drag & drop questions from your bank and assemble an exam in minutes.' },
  { icon: Users, title: 'Student Management', desc: 'Bulk import & batch organization keeps your whole roster in one place.' },
  { icon: Zap, title: 'Auto-Grading', desc: 'Instant results for MCQ and True/False questions — no manual marking.' },
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Track every student\u2019s progress with per-question breakdowns.' },
  { icon: Lock, title: 'Secure Testing', desc: 'Timed exams, randomized questions and restricted access controls.' },
  { icon: FileDown, title: 'Export Reports', desc: 'Download results as CSV and share performance data with anyone.' },
];

const plans = [
  {
    name: 'Free', price: '0', period: 'Free forever',
    desc: 'For small classes getting started with online exams.',
    features: ['Up to 50 students', '10 exams per month', 'MCQ, T/F & Short Answer', 'Basic auto-grading', 'Email support'],
    cta: 'Get Started Free', highlight: false,
  },
  {
    name: 'Pro', price: '999', period: 'per month',
    desc: 'For coaching centers and institutes running regular tests.',
    features: ['Up to 500 students', 'Unlimited exams', 'Advanced analytics', 'Batch & access control', 'CSV exports', 'Priority support'],
    cta: 'Start 14-day Trial', highlight: true,
  },
  {
    name: 'Enterprise', price: 'Custom', period: 'tailored pricing',
    desc: 'For large institutions with custom requirements.',
    features: ['Unlimited students', 'Unlimited everything', 'White-label branding', 'SLA & dedicated manager', 'Custom integrations'],
    cta: 'Contact Sales', highlight: false,
  },
];

const testimonials = [
  {
    quote: 'We run weekly tests for 400+ students. ExamFlow cut our grading time from two days to under an hour.',
    name: 'Rafiqul Islam', role: 'Director, Prodigy Coaching Center', city: 'Dhaka',
  },
  {
    quote: 'The analytics are brilliant. We finally see exactly which questions students struggle with.',
    name: 'Sharmin Akter', role: 'Principal, Bright Future College', city: 'Chattogram',
  },
  {
    quote: 'Setup took one afternoon. Imported our students, built the question bank, and published our first exam the same day.',
    name: 'Mahmud Hasan', role: 'Owner, Delta Training Institute', city: 'Sylhet',
  },
];

const stats = [
  { value: '12,000+', label: 'Exams conducted' },
  { value: '85,000+', label: 'Students assessed' },
  { value: '300+', label: 'Institutes on board' },
  { value: '99.9%', label: 'Platform uptime' },
];

function DashboardMock() {
  return (
    <div className="card shadow-overlay overflow-hidden border-line">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-line bg-gray-50/60">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
        <div className="ml-4 h-5 w-48 rounded-md bg-white border border-line" />
      </div>
      <div className="grid grid-cols-[168px_1fr]">
        <div className="border-r border-line p-3 space-y-1.5 hidden sm:block">
          {['Dashboard', 'Students', 'Question Bank', 'Exams', 'Reports'].map((l, i) => (
            <div key={l} className={`h-6 rounded-md flex items-center px-2 text-[10px] font-medium ${i === 0 ? 'bg-primary-50 text-primary' : 'text-gray'}`}>
              {l}
            </div>
          ))}
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              ['248', 'Students'],
              ['34', 'Exams'],
              ['81%', 'Pass Rate'],
            ].map(([v, l]) => (
              <div key={l} className="border border-line rounded-lg p-2.5">
                <p className="text-base font-bold text-ink leading-none">{v}</p>
                <p className="text-[10px] text-gray mt-1">{l}</p>
              </div>
            ))}
          </div>
          <div className="flex h-24 items-end gap-1.5">
            {[42, 58, 47, 71, 63, 78, 55, 86, 68, 74, 82, 90].map((h, i) => (
              <div key={i} className={`flex-1 rounded-t ${i === 9 ? 'bg-primary' : 'bg-primary-100'}`} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className={`fixed top-0 inset-x-0 z-40 transition-all ${scrolled ? 'bg-white/90 backdrop-blur border-b border-line shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray">
            <button onClick={() => scrollTo('features')} className="hover:text-ink transition-colors">Features</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-ink transition-colors">Pricing</button>
            <button onClick={() => scrollTo('testimonials')} className="hover:text-ink transition-colors">About</button>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/register" className="btn-secondary !border-primary/30 !text-primary hover:!bg-primary-50">Register as Institute</Link>
            <Link to="/login" className="btn-primary">Student Login</Link>
          </div>
          <button className="md:hidden text-gray p-2" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-b border-line px-4 pb-4 space-y-1 animate-slideUp">
            <button onClick={() => { scrollTo('features'); setMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 rounded-control text-sm font-medium text-gray hover:bg-gray-50">Features</button>
            <button onClick={() => { scrollTo('pricing'); setMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 rounded-control text-sm font-medium text-gray hover:bg-gray-50">Pricing</button>
            <button onClick={() => { scrollTo('testimonials'); setMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 rounded-control text-sm font-medium text-gray hover:bg-gray-50">About</button>
            <div className="flex gap-3 pt-2">
              <Link to="/register" className="btn-secondary flex-1">Register as Institute</Link>
              <Link to="/login" className="btn-primary flex-1">Student Login</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-primary-50/70 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-14 items-center">
          <div className="animate-slideUp">
            <span className="inline-flex items-center gap-2 bg-white border border-primary/20 text-primary-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Award className="h-3.5 w-3.5" /> Trusted by 300+ institutes in Bangladesh
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink leading-[1.1]">
              The Smarter Way to Manage{' '}
              <span className="text-primary">Online Exams</span>
            </h1>
            <p className="mt-5 text-lg text-gray leading-relaxed max-w-lg">
              ExamFlow lets coaching centers and institutes create, assign, and grade exams online — with full analytics, auto-grading, and student management.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/register" className="btn-primary !px-6 !py-3 !text-base">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <button onClick={() => scrollTo('features')} className="btn-secondary !px-6 !py-3 !text-base">
                <PlayCircle className="h-4 w-4 text-primary" /> See How It Works
              </button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-bold text-ink">{s.value}</p>
                  <p className="text-xs text-gray mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="animate-slideUp" style={{ animationDelay: '100ms' }}>
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-bglight">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="label !text-primary !mb-3">Everything you need</p>
            <h2 className="text-3xl font-bold tracking-tight text-ink">Built for how institutes actually run exams</h2>
            <p className="mt-3 text-gray">From question bank to certificate — one platform that handles the entire exam lifecycle.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 hover:shadow-cardhover transition-shadow hover:-translate-y-0.5">
                <div className="h-11 w-11 rounded-xl bg-primary-50 text-primary flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="text-sm text-gray mt-1.5 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="label !text-primary !mb-3">Simple workflow</p>
            <h2 className="text-3xl font-bold tracking-tight text-ink">Live in three steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', icon: ClipboardList, title: 'Register your institute', desc: 'Create your account and import students in bulk with a simple CSV.' },
              { n: '02', icon: FilePlus2, title: 'Build your question bank', desc: 'Add MCQ, True/False and Short Answer questions with tags and difficulty.' },
              { n: '03', icon: GraduationCap, title: 'Publish and grade', desc: 'Students take exams in a clean interface. Results are auto-graded instantly.' },
            ].map(({ n, icon: Icon, title, desc }) => (
              <div key={n} className="relative">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white border border-primary/30 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                    {n}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-ink">{title}</h3>
                    </div>
                    <p className="text-sm text-gray mt-1.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-bglight">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="label !text-primary !mb-3">Pricing</p>
            <h2 className="text-3xl font-bold tracking-tight text-ink">Simple pricing that scales with you</h2>
            <p className="mt-3 text-gray">Start free. Upgrade when your institute grows.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => (
              <div key={plan.name} className={`card p-7 flex flex-col ${plan.highlight ? 'border-primary/40 shadow-overlay ring-1 ring-primary/20' : ''}`}>
                {plan.highlight && (
                  <span className="inline-flex self-start items-center gap-1 bg-primary text-white text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3">
                    <Zap className="h-3 w-3" /> Most popular
                  </span>
                )}
                <h3 className="font-semibold text-ink text-lg">{plan.name}</h3>
                <p className="text-sm text-gray mt-1">{plan.desc}</p>
                <div className="mt-5 mb-6">
                  <span className="text-4xl font-extrabold tracking-tight text-ink">{plan.price === '0' ? 'Free' : `BDT ${plan.price}`}</span>
                  <span className="text-sm text-gray ml-1.5">/ {plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink">
                      <span className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center mt-0.5 shrink-0">
                        <Check className="h-3 w-3 text-success" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.highlight ? '/register' : '/register'} className={plan.highlight ? 'btn-primary w-full' : 'btn-secondary w-full'}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="label !text-primary !mb-3">About</p>
            <h2 className="text-3xl font-bold tracking-tight text-ink">Institutes that switched to ExamFlow</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-0.5 text-warning mb-4">{"★★★★★".split('').map((s, i) => <span key={i} className="text-sm">{s}</span>)}</div>
                <p className="text-ink leading-relaxed">“{t.quote}”</p>
                <div className="mt-6 pt-5 border-t border-line flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                    {t.name.split(' ').map((w) => w[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-gray">{t.role}, {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">Ready to run your first online exam?</h2>
          <p className="mt-3 text-primary-100">Join 300+ institutes already using ExamFlow. No credit card required.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register" className="btn bg-white text-primary hover:bg-primary-50 !px-7 !py-3 !text-base font-semibold">Get Started Free</Link>
            <Link to="/login" className="btn border border-white/40 text-white hover:bg-white/10 !px-7 !py-3 !text-base font-semibold">Student Login</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-gray-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5">
                <svg width="30" height="30" viewBox="0 0 48 48">
                  <rect width="48" height="48" rx="12" fill="#1A56DB" />
                  <path d="M14 18h20v4H14zM14 26h20v4H14zM14 34h13v4H14z" fill="#fff" />
                </svg>
                <span className="text-lg font-bold text-white">Exam<span className="text-primary">Flow</span></span>
              </div>
              <p className="mt-4 text-sm text-gray-light leading-relaxed max-w-sm">
                The smarter way to manage online exams for coaching centers, colleges and training organizations across Bangladesh.
              </p>
            </div>
            <div>
              <p className="label !text-gray-400 !mb-4">Product</p>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Student Login</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Register Institute</Link></li>
              </ul>
            </div>
            <div>
              <p className="label !text-gray-400 !mb-4">Company</p>
              <ul className="space-y-2.5 text-sm">
                <li><span className="cursor-default">About</span></li>
                <li><span className="cursor-default">Contact</span></li>
                <li><span className="cursor-default">Terms & Privacy</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-600/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-light">© 2026 ExamFlow. All rights reserved.</p>
            <p className="text-xs text-gray-light">Made in Bangladesh 🇧🇩</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
