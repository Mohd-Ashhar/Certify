import { Loader2 } from 'lucide-react';
import './FormElements.css';

export function Input({ label, error, id, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <input className={`form-input ${error ? 'form-input--error' : ''}`} id={id} {...props} />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function Select({ label, error, id, children, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <select className={`form-select ${error ? 'form-select--error' : ''}`} id={id} {...props}>
        {children}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, id, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <textarea className={`form-textarea ${error ? 'form-textarea--error' : ''}`} id={id} {...props} />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function Button({ children, variant = 'primary', size = 'md', loading = false, fullWidth = false, ...props }) {
  return (
    <button
      className={`form-btn form-btn--${variant} form-btn--${size} ${fullWidth ? 'form-btn--full' : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="form-btn__spinner" />}
      {children}
    </button>
  );
}
