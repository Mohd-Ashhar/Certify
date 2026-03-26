import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import './FormElements.css';

export function Autocomplete({ 
  label, 
  error, 
  id, 
  options = [], 
  value = '', 
  onChange, 
  placeholder = 'Select option...', 
  required = false,
  freeSolo = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef(null);

  // Sync internal input value with external value if it changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Click outside listener to close the dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // On blur, if not freeSolo, enforce matching an option
        if (!freeSolo) {
          const matchingOption = options.find(opt => opt.toLowerCase() === inputValue.toLowerCase());
          if (matchingOption) {
            if (onChange) onChange({ target: { name: id, value: matchingOption } });
            setInputValue(matchingOption);
          } else {
            setInputValue(value);
          }
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, options, freeSolo, value, onChange, id]);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    if (freeSolo) {
      if (onChange) onChange({ target: { name: id, value: e.target.value } });
    }
  };

  const handleOptionClick = (option) => {
    setInputValue(option);
    if (onChange) onChange({ target: { name: id, value: option } });
    setIsOpen(false);
  };

  return (
    <div className="form-group" ref={containerRef}>
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          className={`form-input ${error ? 'form-input--error' : ''}`}
          style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onClick={() => setIsOpen(true)}
          onFocus={() => setIsOpen(true)}
          required={required}
          autoComplete="off"
        />
        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }}>
          <ChevronDown size={18} />
        </div>
        
        {isOpen && (
          <div className="autocomplete-dropdown">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <div 
                  key={idx} 
                  className={`autocomplete-option ${opt === value ? 'autocomplete-option--selected' : ''}`}
                  onClick={() => handleOptionClick(opt)}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="autocomplete-no-opts">No options found</div>
            )}
          </div>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
