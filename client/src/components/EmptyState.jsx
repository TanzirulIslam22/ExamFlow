export default function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={`card flex flex-col items-center justify-center text-center px-8 py-16 ${className}`}>
      {icon && (
        <div className="h-14 w-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-ink text-base">{title}</h3>
      {description && <p className="text-sm text-gray mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
