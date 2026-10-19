import { secondaryButton } from '@/lib/ui';

type PagerProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function Pager({ page, totalPages, onChange }: PagerProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between pt-6">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={secondaryButton}
      >
        Previous
      </button>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className={secondaryButton}
      >
        Next
      </button>
    </nav>
  );
}
