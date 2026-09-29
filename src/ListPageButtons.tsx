const buttonClassName =
  'rounded-xl border border-line px-3 py-2 text-sm font-medium text-fg-strong transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-blue-500 hover:text-blue-400';

interface ListPageButtonsProps {
  currentPage: number;
  totalPages: number | null;
  onPageChange: (page: number) => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
}

export function ListPageButtons({
  currentPage,
  totalPages,
  onPageChange,
  canGoPrevious,
  canGoNext,
}: ListPageButtonsProps) {
  const isFirstPage = canGoPrevious === undefined ? currentPage <= 1 : !canGoPrevious;
  const isLastKnownPage = totalPages !== null && currentPage >= totalPages;
  const isLastPage = canGoNext === undefined ? isLastKnownPage : !canGoNext;

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <button
        type="button"
        onClick={() => onPageChange(1)}
        disabled={isFirstPage}
        className={buttonClassName}
      >
        Primeira
      </button>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={isFirstPage}
        className={buttonClassName}
      >
        Anterior
      </button>
      <span className="min-w-24 text-center text-sm text-fg-muted">
        {totalPages === null ? `Página ${currentPage}` : `Página ${currentPage} de ${totalPages}`}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
        className={buttonClassName}
      >
        Próxima
      </button>
      <button
        type="button"
        onClick={() => {
          if (totalPages !== null) {
            onPageChange(totalPages);
          }
        }}
        disabled={totalPages === null || isLastPage}
        className={buttonClassName}
      >
        Última
      </button>
    </div>
  );
}
