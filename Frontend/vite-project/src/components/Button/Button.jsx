import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary: 'bg-primary text-surface hover:bg-primary-hover shadow-sm hover:shadow-md border border-transparent',
  secondary: 'bg-surface text-dark border border-border hover:border-primary hover:text-primary shadow-sm',
  danger: 'bg-danger text-surface hover:bg-danger-hover shadow-sm border border-transparent',
  outline: 'bg-transparent text-primary border border-primary hover:bg-primary/10 shadow-sm',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-3.5 text-base',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const variantClass = variantClasses[variant] ?? variantClasses.primary;
  const sizeClass = sizeClasses[size] ?? sizeClasses.md;

  return (
    <button
      className={`inline-flex items-center justify-center gap-3 rounded-[18px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />}
      <span
        className={`inline-flex items-center gap-1.5 whitespace-nowrap ${isLoading ? 'opacity-40' : 'opacity-100'
          } transition-opacity duration-200`}
      >
        {children}
      </span>
    </button>
  );
};

export default Button;