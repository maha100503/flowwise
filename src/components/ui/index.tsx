import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../../ThemeContext';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...props }) => {
  const { theme } = useTheme();
  return (
    <label className={cn('text-[11px] font-semibold uppercase tracking-wider mb-1 block', theme.nodeTextMuted, className)} {...props} />
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => {
  const { theme } = useTheme();
  return (
    <input
      autoComplete="off"
      className={cn(
        'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all backdrop-blur-sm',
        theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder,
        className
      )}
      {...props}
    />
  );
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, children, ...props }) => {
  const { theme } = useTheme();
  return (
    <select
      className={cn(
        'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all appearance-none cursor-pointer backdrop-blur-sm',
        theme.inputBg, theme.inputBorder, theme.inputText,
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
};

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className, ...props }) => {
  const { theme } = useTheme();
  return (
    <textarea
      autoComplete="off"
      className={cn(
        'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all min-h-[80px] resize-none backdrop-blur-sm font-mono text-xs leading-relaxed',
        theme.inputBg, theme.inputBorder, theme.inputText, theme.inputPlaceholder,
        className
      )}
      {...props}
    />
  );
};

export const Slider: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => {
  const { theme } = useTheme();
  return (
    <input
      type="range"
      className={cn('w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-500', theme.inputBg, className)}
      {...props}
    />
  );
};

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked = false, onChange, className }) => (
  <button
    type="button"
    onClick={() => onChange?.(!checked)}
    className={cn(
      'relative w-9 h-5 rounded-full transition-colors duration-200',
      checked ? 'bg-blue-500' : 'bg-slate-700',
      className
    )}
  >
    <span
      className={cn(
        'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200',
        checked && 'translate-x-4'
      )}
    />
  </button>
);

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, color, className }) => {
  const { theme } = useTheme();
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest', color || cn(theme.btnBg, theme.nodeTextMuted), className)}>
      {children}
    </span>
  );
};
