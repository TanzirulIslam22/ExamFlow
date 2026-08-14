export default function Badge({ variant = 'neutral', children, className = '' }) {
  const variants = {
    active: 'bg-success/10 text-success-dark',
    live: 'bg-primary/10 text-primary-600',
    draft: 'bg-gray-100 text-gray',
    pending: 'bg-warning/10 text-warning-dark',
    suspended: 'bg-danger/10 text-danger-dark',
    completed: 'bg-gray-100 text-gray-600',
    passed: 'bg-success/10 text-success-dark',
    failed: 'bg-danger/10 text-danger-dark',
    neutral: 'bg-gray-100 text-gray-600',
    info: 'bg-primary-50 text-primary-600',
  };

  const dot = {
    live: 'bg-primary',
    active: 'bg-success',
    pending: 'bg-warning',
    completed: 'bg-gray-light',
    draft: 'bg-gray-light',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {dot[variant] && <span className={`h-1.5 w-1.5 rounded-full ${dot[variant]} ${variant === 'live' ? 'animate-pulse' : ''}`} />}
      {children}
    </span>
  );
}
