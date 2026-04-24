import React, { useMemo } from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, className = '' }) => {
	const safeTotalPages = Math.max(1, Number(totalPages) || 1);
	const safeCurrentPage = Math.min(Math.max(1, Number(currentPage) || 1), safeTotalPages);

	const pages = useMemo(() => {
		return Array.from({ length: safeTotalPages }, (_, index) => index + 1);
	}, [safeTotalPages]);

	const goToPage = (page) => {
		if (!onPageChange) return;
		const next = Math.min(Math.max(1, page), safeTotalPages);
		if (next === safeCurrentPage) return;
		onPageChange(next);
	};

	return (
		<nav className={`pagination ${className}`.trim()} aria-label="Pagination">
			<button
				type="button"
				className="pagination-btn"
				onClick={() => goToPage(safeCurrentPage - 1)}
				disabled={safeCurrentPage === 1}
			>
				Prev
			</button>

			<div className="pagination-pages" aria-label="Page numbers">
				{pages.map((page) => (
					<button
						key={page}
						type="button"
						className={`pagination-page ${page === safeCurrentPage ? 'active' : ''}`.trim()}
						onClick={() => goToPage(page)}
						aria-current={page === safeCurrentPage ? 'page' : undefined}
					>
						{page}
					</button>
				))}
			</div>

			<button
				type="button"
				className="pagination-btn"
				onClick={() => goToPage(safeCurrentPage + 1)}
				disabled={safeCurrentPage === safeTotalPages}
			>
				Next
			</button>
		</nav>
	);
};

export default Pagination;
