import { Input, Select } from './ui/FormElements';
import MultiSelect from './ui/MultiSelect';

/**
 * Renders a single custom field definition as the appropriate form control.
 * Shared by signup, profile, and application approval/rejection flows.
 *
 * Props:
 *   field    — row from custom_user_fields or custom_application_fields
 *   value    — current value (string, number, boolean, array)
 *   onChange — (newValue) => void
 */
export default function CustomFieldRenderer({ field, value, onChange }) {
  const opts = Array.isArray(field.options) ? field.options : [];

  const labelWithRequired = field.required ? `${field.label} *` : field.label;

  if (field.field_type === 'textarea') {
    return (
      <div className="form-group">
        <label className="form-label">{labelWithRequired}</label>
        <textarea
          className="form-textarea"
          rows={3}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={!!field.required}
        />
      </div>
    );
  }

  if (field.field_type === 'select') {
    return (
      <Select
        label={labelWithRequired}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={!!field.required}
      >
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </Select>
    );
  }

  if (field.field_type === 'multiselect') {
    return (
      <MultiSelect
        label={labelWithRequired}
        options={opts.map((o) => ({ value: o, label: o }))}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
      />
    );
  }

  if (field.field_type === 'boolean') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{labelWithRequired}</span>
      </label>
    );
  }

  if (field.field_type === 'date') {
    return (
      <Input
        label={labelWithRequired}
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={!!field.required}
      />
    );
  }

  if (field.field_type === 'number') {
    return (
      <Input
        label={labelWithRequired}
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={!!field.required}
      />
    );
  }

  // default: text
  return (
    <Input
      label={labelWithRequired}
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      required={!!field.required}
    />
  );
}

/**
 * Validate a form's custom field values against their definitions.
 * Returns { valid: boolean, errorKey?: string, errorField?: string }.
 */
export function validateCustomFields(fields, values) {
  for (const field of fields) {
    if (!field.required) continue;
    const v = values?.[field.field_key];
    const missing =
      v === null || v === undefined || v === '' ||
      (Array.isArray(v) && v.length === 0);
    if (missing) {
      return { valid: false, errorField: field.label };
    }
  }
  return { valid: true };
}
