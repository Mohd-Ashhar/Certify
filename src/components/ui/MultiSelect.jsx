import { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import './MultiSelect.css';

/**
 * Searchable checkbox multi-select.
 *
 * Props:
 *   label         — optional label rendered above the field
 *   options       — array of { value, label } (strings/numbers acceptable for value)
 *   value         — array of selected values
 *   onChange      — (nextValues[]) => void
 *   placeholder   — shown when nothing is selected
 *   searchable    — default true, hides search when false
 *   maxVisible    — how many chips to render before collapsing to "+N more"
 */
export default function MultiSelect({
  label,
  options = [],
  value = [],
  onChange,
  placeholder = 'Select…',
  searchable = true,
  maxVisible = 3,
  id,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o => String(o.label).toLowerCase().includes(q));
  }, [options, search]);

  const selectedLabels = useMemo(() => {
    const map = new Map(options.map(o => [String(o.value), o.label]));
    return value.map(v => map.get(String(v))).filter(Boolean);
  }, [options, value]);

  const toggle = (val) => {
    const key = String(val);
    const set = new Set(value.map(String));
    if (set.has(key)) set.delete(key);
    else set.add(key);
    // Preserve original types from options
    const next = options.filter(o => set.has(String(o.value))).map(o => o.value);
    onChange?.(next);
  };

  const removeOne = (val, e) => {
    e.stopPropagation();
    toggle(val);
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange?.([]);
  };

  return (
    <div className="form-group" ref={containerRef}>
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <div className={`ms ${open ? 'ms--open' : ''}`}>
        <button
          type="button"
          id={id}
          className="ms__control"
          onClick={() => setOpen(o => !o)}
        >
          <div className="ms__chips">
            {selectedLabels.length === 0 && (
              <span className="ms__placeholder">{placeholder}</span>
            )}
            {selectedLabels.slice(0, maxVisible).map((lbl, i) => (
              <span key={i} className="ms__chip">
                {lbl}
                <X size={12} onClick={(e) => removeOne(value[i], e)} />
              </span>
            ))}
            {selectedLabels.length > maxVisible && (
              <span className="ms__chip ms__chip--more">
                +{selectedLabels.length - maxVisible}
              </span>
            )}
          </div>
          <div className="ms__actions">
            {value.length > 0 && (
              <X size={14} className="ms__clear" onClick={clearAll} />
            )}
            <ChevronDown size={16} className="ms__caret" />
          </div>
        </button>

        {open && (
          <div className="ms__dropdown">
            {searchable && (
              <div className="ms__search">
                <Search size={14} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  autoFocus
                />
              </div>
            )}
            <div className="ms__list">
              {filtered.length === 0 ? (
                <div className="ms__empty">No results</div>
              ) : (
                filtered.map(opt => {
                  const isSel = value.map(String).includes(String(opt.value));
                  return (
                    <div
                      key={opt.value}
                      className={`ms__option ${isSel ? 'ms__option--sel' : ''}`}
                      onClick={() => toggle(opt.value)}
                    >
                      <span className={`ms__check ${isSel ? 'ms__check--on' : ''}`}>
                        {isSel && <Check size={12} />}
                      </span>
                      <span className="ms__opt-label">{opt.label}</span>
                    </div>
                  );
                })
              )}
            </div>
            {value.length > 0 && (
              <div className="ms__footer">
                <span>{value.length} selected</span>
                <button type="button" className="ms__footer-clear" onClick={clearAll}>
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
