import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, total, limit, onChange }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-line">
      <p className="text-xs text-gray">
        Showing <span className="font-medium text-ink">{from}–{to}</span> of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          className="btn-ghost !px-2.5 !py-1.5 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium text-gray px-2">Page {page} of {pages}</span>
        <button
          className="btn-ghost !px-2.5 !py-1.5 disabled:opacity-40"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
