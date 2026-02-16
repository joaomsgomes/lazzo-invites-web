'use client';

import { useRef, useState, useEffect } from 'react';
import { BrandColors } from '../../design/constants';

interface OtpInputProps {
  length: number;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function OtpInput({ length, onChange, disabled }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    setTimeout(() => inputsRef.current[0]?.focus(), 100);
  }, []);

  const updateDigits = (newDigits: string[]) => {
    setDigits(newDigits);
    onChange(newDigits.join(''));
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const nd = [...digits];
      nd[index] = '';
      updateDigits(nd);
      return;
    }

    // Take last digit typed (handles overwrite of existing digit)
    const digit = val[val.length - 1];
    const nd = [...digits];
    nd[index] = digit;
    updateDigits(nd);

    // Auto-advance
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const nd = [...digits];
      if (nd[index]) {
        nd[index] = '';
        updateDigits(nd);
      } else if (index > 0) {
        nd[index - 1] = '';
        updateDigits(nd);
        inputsRef.current[index - 1]?.focus();
      }
    }
    // Arrow key navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const nd = Array(length).fill('');
    for (let i = 0; i < pasted.length; i++) {
      nd[i] = pasted[i];
    }
    updateDigits(nd);
    const focusIdx = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIdx]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={2}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          style={{
            width: '44px',
            height: '52px',
            textAlign: 'center',
            fontSize: '22px',
            fontWeight: 600,
            color: BrandColors.text1,
            background: BrandColors.bg2,
            border: `1.5px solid ${digit ? BrandColors.planning : BrandColors.border}`,
            borderRadius: '10px',
            outline: 'none',
            caretColor: BrandColors.planning,
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = BrandColors.planning;
            e.target.select();
          }}
          onBlur={(e) => {
            e.target.style.borderColor = digit ? BrandColors.planning : BrandColors.border;
          }}
        />
      ))}
    </div>
  );
}
