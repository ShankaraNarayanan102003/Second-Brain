import { useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Sun, 
  Moon, 
  ShieldCheck, 
  Sparkles, 
  Mail, 
  Lock, 
  Phone, 
  User, 
  ArrowRight, 
  KeyRound, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

type AuthTab = 'google' | 'email' | 'phone';
type EmailMode = 'signin' | 'signup' | 'forgot';

export function LoginPage() {
  const { 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    sendPasswordReset, 
    sendPhoneOtp, 
    verifyPhoneOtp, 
    continueAsGuest, 
    loading, 
    error,
    clearError,
    phoneConfirmationWaiting
  } = useAuth();
  
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<AuthTab>('email');
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+91 ');
  const [otpCode, setOtpCode] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleTabChange = (tab: AuthTab) => {
    clearError();
    setSuccessMessage(null);
    setActiveTab(tab);
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    if (emailMode === 'signin') {
      await signInWithEmail(email, password);
    } else if (emailMode === 'signup') {
      await signUpWithEmail(email, password, displayName);
    } else if (emailMode === 'forgot') {
      await sendPasswordReset(email);
      setSuccessMessage('Password reset email sent. Please check your inbox.');
    }
  };

  const handleSendPhoneOtp = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    const success = await sendPhoneOtp(phoneNumber, 'recaptcha-container');
    if (success) {
      setSuccessMessage('SMS verification code sent to ' + phoneNumber);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    await verifyPhoneOtp(otpCode);
  };

  const isConfigError = error && (error.includes('configuration-not-found') || error.includes('not enabled'));

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--bg-app)',
        position: 'relative'
      }}
    >
      {/* Invisible container for Firebase Phone reCAPTCHA */}
      <div id="recaptcha-container"></div>

      {/* Top Controls (Theme Toggle) */}
      <div
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center'
        }}
      >
        <button
          id="login-theme-toggle"
          type="button"
          onClick={toggleTheme}
          className="neu-icon-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Main Neumorphic Login Card */}
      <div
        className="neu-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2.25rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 10
        }}
      >
        {/* Egyptian Gold Emblem */}
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--surface-control)',
            boxShadow: 'var(--neu-shadow-raised-md)',
            border: '2px solid var(--border-gold-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <img
            src="/icon.svg"
            alt="Second Brain Emblem"
            width={52}
            height={52}
            style={{ borderRadius: '50%' }}
          />
        </div>

        {/* Title */}
        <h1
          className="font-display gold-gradient-text"
          style={{
            fontSize: '1.625rem',
            letterSpacing: '0.08em',
            marginBottom: '0.25rem'
          }}
        >
          SECOND BRAIN
        </h1>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.25rem',
            maxWidth: '360px'
          }}
        >
          Personal cognitive sanctuary & knowledge management system.
        </p>

        {/* Connected Project Badge */}
        <div
          className="neu-inset"
          style={{
            width: '100%',
            padding: '0.5rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: '1.25rem'
          }}
        >
          <ShieldCheck size={14} color="var(--gold-primary)" />
          <span>
            Firebase: <strong style={{ color: 'var(--text-gold)' }}>shan-second-brain</strong>
          </span>
        </div>

        {/* Auth Method Segmented Tabs */}
        <div
          className="neu-inset"
          style={{
            width: '100%',
            padding: '0.35rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            gap: '0.35rem',
            marginBottom: '1.25rem'
          }}
        >
          <button
            id="tab-email-auth"
            type="button"
            onClick={() => handleTabChange('email')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.55rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: activeTab === 'email' ? '1px solid var(--border-gold-subtle)' : '1px solid transparent',
              background: activeTab === 'email' ? 'var(--surface-raised)' : 'transparent',
              boxShadow: activeTab === 'email' ? 'var(--neu-shadow-raised-sm)' : 'none',
              color: activeTab === 'email' ? 'var(--text-gold)' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--neu-transition)',
              fontFamily: 'var(--font-body)'
            }}
          >
            <Mail size={14} />
            <span>Email</span>
          </button>

          <button
            id="tab-google-auth"
            type="button"
            onClick={() => handleTabChange('google')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.55rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: activeTab === 'google' ? '1px solid var(--border-gold-subtle)' : '1px solid transparent',
              background: activeTab === 'google' ? 'var(--surface-raised)' : 'transparent',
              boxShadow: activeTab === 'google' ? 'var(--neu-shadow-raised-sm)' : 'none',
              color: activeTab === 'google' ? 'var(--text-gold)' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--neu-transition)',
              fontFamily: 'var(--font-body)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Google</span>
          </button>

          <button
            id="tab-phone-auth"
            type="button"
            onClick={() => handleTabChange('phone')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.55rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: activeTab === 'phone' ? '1px solid var(--border-gold-subtle)' : '1px solid transparent',
              background: activeTab === 'phone' ? 'var(--surface-raised)' : 'transparent',
              boxShadow: activeTab === 'phone' ? 'var(--neu-shadow-raised-sm)' : 'none',
              color: activeTab === 'phone' ? 'var(--text-gold)' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--neu-transition)',
              fontFamily: 'var(--font-body)'
            }}
          >
            <Phone size={14} />
            <span>Phone</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#4ADE80',
              fontSize: '0.8125rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textAlign: 'left'
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            className="neu-inset"
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-gold-subtle)',
              marginBottom: '1rem',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-gold)', fontSize: '0.8125rem', fontWeight: 700 }}>
              <ShieldCheck size={15} />
              <span>Firebase Configuration Note</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
              {isConfigError ? (
                <>
                  This sign-in provider is not enabled yet in your Firebase Console (<strong>shan-second-brain</strong>).
                  <br />
                  Enable Email, Google, or Phone under <strong>Build &gt; Authentication &gt; Sign-in method</strong>.
                </>
              ) : (
                error
              )}
            </p>
            {isConfigError && (
              <div style={{ marginTop: '0.5rem' }}>
                <a
                  href="https://console.firebase.google.com/project/shan-second-brain/authentication/providers"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.6875rem',
                    color: 'var(--text-gold)',
                    textDecoration: 'none',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-gold-subtle)',
                    background: 'var(--surface-raised)'
                  }}
                >
                  <span>Open Sign-in Providers</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: GOOGLE AUTHENTICATION */}
        {activeTab === 'google' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Sign in with your verified Google account:
            </p>
            <button
              id="btn-google-signin"
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              className="neu-btn neu-btn-gold"
              style={{
                width: '100%',
                padding: '0.9rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.85rem',
                fontSize: '0.9375rem',
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
            </button>
          </div>
        )}

        {/* TAB 2: EMAIL / PASSWORD AUTHENTICATION */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {emailMode === 'signup' && (
              <div style={{ position: 'relative' }}>
                <input
                  id="input-signup-name"
                  type="text"
                  placeholder="Your Full Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="neu-input"
                  required
                />
              </div>
            )}

            <div>
              <input
                id="input-auth-email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neu-input"
                required
              />
            </div>

            {emailMode !== 'forgot' && (
              <div>
                <input
                  id="input-auth-password"
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neu-input"
                  required
                  minLength={6}
                />
              </div>
            )}

            {emailMode === 'signin' && (
              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setEmailMode('forgot');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-gold)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              id="btn-email-submit"
              type="submit"
              disabled={loading}
              className="neu-btn neu-btn-gold"
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.25rem'
              }}
            >
              {loading ? (
                'Processing...'
              ) : emailMode === 'signin' ? (
                'Sign In'
              ) : emailMode === 'signup' ? (
                'Create Account'
              ) : (
                'Send Reset Link'
              )}
            </button>

            {/* Switch between Sign In / Sign Up / Forgot */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {emailMode === 'signin' ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setEmailMode('signup');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-gold)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Sign up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setEmailMode('signin');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-gold)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Sign in
                  </button>
                </span>
              )}
            </div>
          </form>
        )}

        {/* TAB 3: PHONE NUMBER AUTHENTICATION */}
        {activeTab === 'phone' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {!phoneConfirmationWaiting ? (
              <form onSubmit={handleSendPhoneOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Enter your mobile number with country code (e.g. <code>+91 9876543210</code> or <code>+1 555...</code>):
                </p>
                <input
                  id="input-phone-number"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="neu-input"
                  required
                />
                <button
                  id="btn-send-phone-otp"
                  type="submit"
                  disabled={loading}
                  className="neu-btn neu-btn-gold"
                  style={{ width: '100%', padding: '0.85rem' }}
                >
                  {loading ? 'Sending Code...' : 'Send Verification SMS'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Enter the 6-digit code sent to <strong>{phoneNumber}</strong>:
                </p>
                <input
                  id="input-otp-code"
                  type="text"
                  placeholder="6-digit SMS Code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="neu-input"
                  maxLength={6}
                  required
                  autoFocus
                />
                <button
                  id="btn-verify-otp"
                  type="submit"
                  disabled={loading}
                  className="neu-btn neu-btn-gold"
                  style={{ width: '100%', padding: '0.85rem' }}
                >
                  {loading ? 'Verifying...' : 'Verify Code & Sign In'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Guest / Foundation Preview Option */}
        <div style={{ marginTop: '1.5rem', width: '100%', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            id="btn-guest-preview"
            type="button"
            onClick={continueAsGuest}
            className="neu-btn"
            style={{
              width: '100%',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: 'var(--text-gold)',
              border: '1px solid var(--border-gold-subtle)'
            }}
          >
            <Sparkles size={15} color="var(--gold-primary)" />
            <span>Explore Foundation (Preview Mode)</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          marginTop: '1.75rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.04em'
        }}
      >
        SECOND BRAIN &bull; EGYPTIAN LIQUID GOLD EDITION
      </footer>
    </div>
  );
}
