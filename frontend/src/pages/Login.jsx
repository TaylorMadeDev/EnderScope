import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LogIn,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { loginSchema, validateAuthField, validateAuthForm } from '../utils/authValidation';
import AuthPasswordRequirementsPanel from '../components/AuthPasswordRequirementsPanel';

function PasswordField({ value, onChange, onBlur, error }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`auth-input-shell ${error ? 'has-error' : ''}`}>
      <Lock className="auth-input-icon" />
      <input
        className="input auth-input auth-input-password"
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder="Enter your password"
        aria-invalid={error ? 'true' : 'false'}
      />
      <button
        type="button"
        className="auth-input-toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        <span>{visible ? 'Hide' : 'Show'}</span>
      </button>
    </div>
  );
}

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const urlError = new URLSearchParams(location.search).get('error');
  const errorMessages = {
    google_failed: 'Google sign-in failed. Please try again.',
    invalid_state: 'Google sign-in expired or was interrupted. Please try again.',
    no_code: 'Google did not return an authorization code. Please try again.',
    token_exchange_failed: 'Google sign-in could not finish token exchange.',
    profile_fetch_failed: 'Google account data could not be loaded.',
    google_not_configured: 'Google sign-in is not configured yet.',
    db_unavailable: 'Google sign-in reached the app, but the database is unavailable.',
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [error, setError] = useState(
    urlError ? errorMessages[urlError] || 'Google sign-in failed. Please try again.' : ''
  );
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [requirementsOpen, setRequirementsOpen] = useState(false);

  const values = { email, password };

  const setFieldValue = async (field, value) => {
    const nextValues = { ...values, [field]: value };
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);

    if (touched[field]) {
      const message = await validateAuthField(loginSchema, field, nextValues);
      setFieldErrors((current) => ({
        ...current,
        [field]: message,
      }));
    }
  };

  const handleBlur = async (field) => {
    const nextTouched = { ...touched, [field]: true };
    setTouched(nextTouched);
    const message = await validateAuthField(loginSchema, field, values);
    setFieldErrors((current) => ({
      ...current,
      [field]: message,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const nextTouched = { email: true, password: true };
    setTouched(nextTouched);
    const validationErrors = await validateAuthForm(loginSchema, values);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen bg-[#0b0014] flex items-center justify-center px-4 relative overflow-hidden">
      <Link to="/" className="auth-return-link">
        <ArrowLeft className="w-4 h-4" />
        Return to Home
      </Link>
      <div className="star-field" />
      <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[200px] opacity-[0.07] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-100px] w-[400px] h-[400px] bg-indigo-600 rounded-full blur-[200px] opacity-[0.05] pointer-events-none" />
      <img src="/assets/end-island.webp" alt="" className="auth-scene auth-scene-island" />
      <img src="/assets/chorus-plant.png" alt="" className="auth-scene auth-scene-chorus-left" />
      <img src="/assets/chorus-plant.png" alt="" className="auth-scene auth-scene-chorus-right" />
      <img src="/assets/enderman.png" alt="" className="auth-scene auth-scene-enderman" />

      <div className="w-full max-w-6xl relative z-10">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex flex-col items-center gap-4 mb-4 group">
            <img
              src="/assets/EnderScopeLogo.svg"
              alt="EnderScope"
              className="h-12 w-auto object-contain auth-logo"
            />
            <span className="font-black text-2xl tracking-tight text-white">EnderScope</span>
          </Link>
          <p className="text-gray-500 text-sm">Sign in to access the dashboard</p>
        </div>

        <div className={`auth-card-shell ${requirementsOpen ? 'guide-open' : ''}`}>
          <div className="glass-end rounded-2xl p-8 auth-card">
            <div className="auth-card-topbar">
              <div className="auth-card-topcopy">
                <span className="auth-card-kicker">Sign in</span>
              </div>
              <AuthPasswordRequirementsPanel
                open={requirementsOpen}
                onToggle={() => setRequirementsOpen((current) => !current)}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-500/[0.08] border border-rose-500/20 rounded-xl p-3 mb-6 text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <div className={`auth-input-shell ${fieldErrors.email ? 'has-error' : ''}`}>
                  <Mail className="auth-input-icon" />
                  <input
                    className="input auth-input"
                    type="email"
                    value={email}
                    onChange={(event) => setFieldValue('email', event.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="you@example.com"
                    aria-invalid={fieldErrors.email ? 'true' : 'false'}
                  />
                </div>
                {fieldErrors.email && <p className="auth-field-error">{fieldErrors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() => setForgotOpen(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <PasswordField
                  value={password}
                  onChange={(event) => setFieldValue('password', event.target.value)}
                  onBlur={() => handleBlur('password')}
                  error={fieldErrors.password}
                />
                {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password}</p>}
              </div>

              <button className="btn btn-primary w-full mt-2" type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#12101f] px-3 text-gray-600">or</span>
              </div>
            </div>

            <button onClick={googleLogin} className="btn btn-secondary w-full gap-3">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium">
            Sign up
          </Link>
        </p>
      </div>

      {forgotOpen && (
        <div className="auth-modal-backdrop" onClick={() => setForgotOpen(false)}>
          <div className="auth-modal glass-end" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="auth-modal-close"
              onClick={() => setForgotOpen(false)}
              aria-label="Close forgot password dialog"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="auth-modal-icon">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="auth-modal-title">Forgot your password?</h3>
            <p className="auth-modal-copy">
              Password reset email flow isn&apos;t wired up in this build yet. If your account is linked to Google, use
              Google sign-in. Otherwise you&apos;ll need a manual reset or to sign in first and change it from account settings.
            </p>
            <div className="auth-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setForgotOpen(false)}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={googleLogin}>
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
