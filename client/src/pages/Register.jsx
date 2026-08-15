import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, Mail, Lock, User, Phone, MapPin, UploadCloud, AlertCircle, ArrowLeft, Eye, EyeOff, CheckCircle2,
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/Spinner.jsx';
import { auth, googleProvider, fbEnabled } from '../firebase.js';

const instituteTypes = ['School', 'College', 'Coaching Center', 'Corporate'];

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function Field({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <Icon className="h-4 w-4 text-gray-light absolute left-3 top-1/2 -translate-y-1/2" />
        <div className="[&>input]:!pl-9 [&>select]:!pl-9">{children}</div>
      </div>
      {error && <p className="text-xs text-danger mt-1.5">{error}</p>}
    </div>
  );
}

export default function Register() {
  const [form, setForm] = useState({
    name: '', type: 'Coaching Center', ownerName: '', email: '', phone: '', city: '',
    password: '', confirmPassword: '', logo: '', terms: false,
  });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleGoogle = async () => {
    if (!fbEnabled) return setErrors({ form: 'Firebase is not configured. Set your Firebase keys in the client .env file.' });
    setGoogleLoading(true);
    setErrors({});
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const name = cred.user.displayName || '';
      const email = cred.user.email || '';
      setForm((f) => ({ ...f, ownerName: f.ownerName || name, email: f.email || email, terms: f.terms }));
      toast.success(`Signed in as ${email}. Complete your institute details to finish.`);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') setErrors({ form: err.message });
    } finally {
      setGoogleLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Institute name is required';
    if (!form.ownerName.trim()) e.ownerName = 'Owner name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.terms) e.terms = 'You must agree to the Terms & Privacy Policy';
    return e;
  };

  const handleLogo = (file) => {
    if (!file) return;
    if (file.size > 500 * 1024) {
      setErrors((e) => ({ ...e, logo: 'Logo must be under 500 KB' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('logo', reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const eObj = validate();
    setErrors(eObj);
    if (Object.keys(eObj).length) return;
    const res = await register({ ...form, confirmPassword: form.confirmPassword });
    if (!res.ok) return setErrors({ form: res.error });
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-bglight flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[42%] bg-primary relative overflow-hidden flex-col justify-between p-12 text-white">
        <Link to="/" className="flex items-center gap-2.5 w-fit">
          <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 48 48">
              <rect width="48" height="48" rx="12" fill="#fff" />
              <path d="M14 18h20v4H14zM14 26h20v4H14zM14 34h13v4H14z" fill="#1A56DB" />
            </svg>
          </div>
          <span className="text-lg font-bold">Exam<span className="text-primary-100">Flow</span></span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight">Move your institute's exams online</h2>
          <p className="mt-4 text-primary-100/90 leading-relaxed max-w-md">
            Set up your institute in minutes. Import students, build a question bank and run your first exam the same day.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              'Free plan for up to 50 students',
              'Bulk student import via CSV',
              'Auto-graded MCQ & True/False',
              'Detailed analytics and reports',
            ].map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="h-5 w-5 rounded-full bg-white/15 flex items-center justify-center">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-primary-100/70">© 2026 ExamFlow · Dhaka, Bangladesh</p>
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-white/10" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray hover:text-ink mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-ink">Register Your Institute</h1>
          <p className="text-sm text-gray mt-1.5">Start managing online exams for your students today.</p>

          <form onSubmit={handleSubmit} className="card mt-7 p-7 space-y-4" noValidate>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="btn-secondary w-full !py-3 !border-line hover:!bg-gray-50"
            >
              {googleLoading ? <Spinner size={18} /> : <GoogleIcon />}
              {form.email ? (
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Continue as {form.email}</span>
              ) : (
                'Continue with Google'
              )}
            </button>

            <div className="flex items-center gap-3">
              <span className="flex-1 h-px bg-line" />
              <span className="text-xs text-gray-light uppercase tracking-wide">or fill the form</span>
              <span className="flex-1 h-px bg-line" />
            </div>

            {errors.form && (
              <div className="flex items-start gap-2.5 bg-danger/5 border border-danger/20 text-danger-dark text-sm rounded-control px-3.5 py-3">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>{errors.form}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Institute Name" icon={Building2} error={errors.name}>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Prodigy Coaching Center" className={`input ${errors.name && '!border-danger'}`} />
              </Field>
              <div>
                <label className="label">Institute Type</label>
                <select value={form.type} onChange={(e) => set('type', e.target.value)} className="input">
                  {instituteTypes.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <Field label="Owner Full Name" icon={User} error={errors.ownerName}>
              <input value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} placeholder="Your full name" className={`input ${errors.ownerName && '!border-danger'}`} />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Official Email" icon={Mail} error={errors.email}>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="admin@institute.com" className={`input ${errors.email && '!border-danger'}`} />
              </Field>
              <Field label="Phone Number" icon={Phone} error={errors.phone}>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="017XXXXXXXX" className={`input ${errors.phone && '!border-danger'}`} />
              </Field>
            </div>

            <Field label="City" icon={MapPin} error={errors.city}>
              <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Dhaka" className={`input ${errors.city && '!border-danger'}`} />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-gray-light absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Minimum 6 characters" className={`input !pl-9 ${errors.password && '!border-danger'}`} />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-light hover:text-gray">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-danger mt-1.5">{errors.password}</p>}
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-gray-light absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type={showPw ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} placeholder="Re-enter password" className={`input !pl-9 ${errors.confirmPassword && '!border-danger'}`} />
                </div>
                {errors.confirmPassword && <p className="text-xs text-danger mt-1.5">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Logo upload */}
            <div>
              <label className="label">Institute Logo <span className="normal-case tracking-normal text-gray-light">(optional)</span></label>
              <label className={`flex items-center gap-3 border border-dashed rounded-control p-4 cursor-pointer transition-colors ${form.logo ? 'border-success/40 bg-success/5' : 'border-gray-300 hover:border-primary'}`}>
                {form.logo ? (
                  <img src={form.logo} alt="logo" className="h-11 w-11 rounded-lg object-cover" />
                ) : (
                  <div className="h-11 w-11 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <UploadCloud className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{form.logo ? 'Logo uploaded — click to change' : 'Upload institute logo'}</p>
                  <p className="text-xs text-gray">PNG or JPG, up to 500 KB</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files[0])} />
              </label>
              {errors.logo && <p className="text-xs text-danger mt-1.5">{errors.logo}</p>}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(e) => set('terms', e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-line text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray leading-snug">
                I agree to the <span className="text-primary font-medium">Terms of Service</span> and <span className="text-primary font-medium">Privacy Policy</span>
              </span>
            </label>
            {errors.terms && <p className="text-xs text-danger -mt-2">{errors.terms}</p>}

            <button type="submit" className="btn-primary w-full !py-3 !mt-2" disabled={loading}>
              {loading ? <Spinner size={18} /> : 'Create Institute Account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray text-center">
            Already registered? <Link to="/login" className="text-primary font-medium hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
