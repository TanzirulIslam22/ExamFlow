import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2, GraduationCap, Mail, Lock, ArrowRight, AlertCircle, Smartphone, Phone, KeyRound,
} from 'lucide-react';
import { signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import Logo from '../components/Logo.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';
import { useToast } from '../context/ToastContext.jsx';
import client from '../api/client.js';
import { auth, googleProvider, fbEnabled } from '../firebase.js';

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

export default function Login() {
  const [role, setRole] = useState('institute');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fbBusy, setFbBusy] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+880');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const { login, setUser, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Please enter your email and password');
    const res = await login(role, email, password);
    if (!res.ok) return setError(res.error);
    navigate(role === 'institute' ? '/admin' : '/student');
  };

  const finishFirebase = async (idToken, provider) => {
    setFbBusy(true);
    setError('');
    try {
      const res = await client.post(`/auth/firebase/${provider}`, { role, idToken });
      setUser(res.token, res.user);
      navigate(role === 'institute' ? '/admin' : '/student');
      toast.success(`Welcome back, ${res.user.name || res.user.ownerName || ''}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setFbBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (!fbEnabled) return setError('Firebase is not configured. Set your Firebase keys in the client .env file.');
    setFbBusy(true);
    setError('');
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken();
      await finishFirebase(idToken, 'google');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') setError(err.message);
    } finally {
      setFbBusy(false);
    }
  };

  const sendOtp = async () => {
    if (!fbEnabled) return setError('Firebase is not configured. Set your Firebase keys in the client .env file.');
    setFbBusy(true);
    setError('');
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'phone-recaptcha', { size: 'invisible' });
      }
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaRef.current);
      window.__phoneConfirmation = confirmation;
      setOtpSent(true);
      toast.info('OTP sent to your phone');
    } catch (err) {
      setError(err.code === 'auth/too-many-requests' ? 'Too many requests. Try again later.' : err.message);
    } finally {
      setFbBusy(false);
    }
  };

  const confirmOtp = async () => {
    if (!otp.trim()) return setError('Enter the 6-digit OTP');
    setFbBusy(true);
    setError('');
    try {
      const confirmation = window.__phoneConfirmation;
      const cred = await confirmation.confirm(otp);
      const idToken = await cred.user.getIdToken();
      setPhoneOpen(false);
      setOtpSent(false);
      setOtp('');
      await finishFirebase(idToken, 'phone');
    } catch (err) {
      setError(err.code === 'auth/invalid-verification-code' ? 'Invalid OTP. Please try again.' : err.message);
    } finally {
      setFbBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-bglight flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[46%] bg-primary relative overflow-hidden flex-col justify-between p-12 text-white">
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
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Welcome back to your<br />exam control room
          </h2>
          <p className="mt-4 text-primary-100/90 leading-relaxed max-w-md">
            Publish exams, review analytics and manage your students — all from one dashboard.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {[
              ['85,000+', 'students'],
              ['12,000+', 'exams'],
              ['300+', 'institutes'],
            ].map(([v, l]) => (
              <div key={l} className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur">
                <p className="font-bold text-lg">{v}</p>
                <p className="text-xs text-primary-100/80">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-primary-100/70">© 2026 ExamFlow · Dhaka, Bangladesh</p>
        <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Link to="/"><Logo /></Link>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink">Sign in to ExamFlow</h1>
          <p className="text-sm text-gray mt-1.5">Continue to your dashboard or exam portal.</p>

          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-control mt-7">
            <button
              onClick={() => setRole('institute')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-control text-sm font-medium transition-all ${role === 'institute' ? 'bg-white shadow-sm text-primary-600' : 'text-gray'}`}
            >
              <Building2 className="h-4 w-4" /> Institute
            </button>
            <button
              onClick={() => setRole('student')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-control text-sm font-medium transition-all ${role === 'student' ? 'bg-white shadow-sm text-primary-600' : 'text-gray'}`}
            >
              <GraduationCap className="h-4 w-4" /> Student
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-danger/5 border border-danger/20 text-danger-dark text-sm rounded-control px-3.5 py-3 animate-fadeIn">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-gray-light absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'institute' ? 'admin@yourinstitute.com' : 'you@student.com'}
                  className={`input !pl-9 ${error && '!border-danger'}`} required
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Password</label>
                <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Forgot password?</span>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-gray-light absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className={`input !pl-9 ${error && '!border-danger'}`} required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full !py-3 !mt-6" disabled={loading}>
              {loading ? <Spinner size={18} /> : <>Sign In with Email <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <span className="flex-1 h-px bg-line" />
            <span className="text-xs text-gray-light uppercase tracking-wide">or continue with</span>
            <span className="flex-1 h-px bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogle}
              disabled={fbBusy}
              className="btn-secondary !py-3 border-line hover:bg-gray-50"
            >
              <GoogleIcon /> Google
            </button>
            <button
              onClick={() => { setError(''); setPhoneOpen(true); }}
              disabled={fbBusy}
              className="btn-secondary !py-3 border-line hover:bg-gray-50"
            >
              <Smartphone className="h-4 w-4 text-primary" /> Phone OTP
            </button>
          </div>

          <div className="mt-6 text-sm text-gray text-center">
            New institute?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Register here</Link>
          </div>

          <div className="mt-10 bg-primary-50 border border-primary/10 rounded-card p-4 text-xs text-primary-600 leading-relaxed">
            <strong>Demo access</strong> — Institute: admin@prodigy.com / admin123 · Student: ayesha@student.com / student123
          </div>
        </div>
      </div>

      {/* Phone OTP modal */}
      <Modal
        open={phoneOpen}
        onClose={() => { setPhoneOpen(false); setOtpSent(false); setOtp(''); setError(''); }}
        title={role === 'student' ? 'Login with Phone OTP' : 'Institute Phone Login'}
        size="sm"
        footer={
          otpSent ? (
            <>
              <button className="btn-secondary" onClick={() => setOtpSent(false)}>Change number</button>
              <button className="btn-primary" onClick={confirmOtp} disabled={fbBusy}>
                {fbBusy ? <Spinner size={16} /> : 'Verify OTP'}
              </button>
            </>
          ) : (
            <button className="btn-primary w-full" onClick={sendOtp} disabled={fbBusy}>
              {fbBusy ? <Spinner size={16} /> : <><Phone className="h-4 w-4" /> Send OTP</>}
            </button>
          )
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray">
            {role === 'student'
              ? 'Enter the phone number your institute has on file. You will receive a 6-digit OTP.'
              : 'Enter the phone number registered for your institute account.'}
          </p>
          {error && (
            <div className="flex items-start gap-2.5 bg-danger/5 border border-danger/20 text-danger-dark text-sm rounded-control px-3.5 py-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {!otpSent ? (
            <div>
              <label className="label">Phone number</label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+8801XXXXXXXXX"
                className="input"
              />
              <div id="phone-recaptcha" />
            </div>
          ) : (
            <div>
              <label className="label flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Enter OTP</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                inputMode="numeric"
                className="input !text-center !text-lg !tracking-[0.5em] !font-mono"
              />
              <p className="text-xs text-gray mt-2">We sent a code to {phoneNumber}. It expires in 30 seconds.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
