import { KeyRound, Check } from 'lucide-react';

const passwordRequirements = [
  'At least 8 characters',
  'At least 1 capital letter',
  'At least 1 lowercase letter',
  'At least 1 number',
];

export default function AuthPasswordRequirementsPanel({ open, onToggle }) {
  return (
    <div className="auth-requirements-shell">
      <button
        type="button"
        className={`auth-requirements-link ${open ? 'open' : ''}`}
        onClick={onToggle}
      >
        <span>Password Requirements -&gt;</span>
      </button>

      <aside className={`glass auth-requirements-card auth-requirements-panel ${open ? 'open' : ''}`}>
        <div className="auth-requirements-kicker">
          <KeyRound className="w-4 h-4 text-purple-300" />
          Password Guide
        </div>
        <h2 className="auth-requirements-title">Remember, your password has;</h2>
        <p className="auth-requirements-copy">
          These are the rules EnderScope expects when you create or update a password.
        </p>

        <div className="auth-requirements-list">
          {passwordRequirements.map((item) => (
            <div key={item} className="auth-requirement-item">
              <span className="auth-requirement-icon">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
