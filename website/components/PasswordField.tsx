'use client';

import { useState } from 'react';

interface Props {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PasswordField({
  id,
  name,
  label,
  placeholder,
  required,
  minLength,
  autoComplete,
  value,
  onChange,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[#94a3b8] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className="w-full bg-[#111827] border border-white/20 rounded-lg px-4 py-3 pr-24 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#c5a46e]"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded border border-white/20 text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-white/5"
          aria-pressed={visible}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}