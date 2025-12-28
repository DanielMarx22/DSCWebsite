import Link from "next/link";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string; // e.g. "/shop/lps"
}

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
    // Don't show pagination if there's only 1 page
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center gap-4 mt-12 mb-8">
            {/* PREVIOUS BUTTON */}
            {currentPage > 1 ? (
                <Link
                    href={`${baseUrl}?page=${currentPage - 1}`}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                    Previous
                </Link>
            ) : (
                <span className="px-4 py-2 border rounded text-gray-300 cursor-not-allowed">
                    Previous
                </span>
            )}

            {/* PAGE COUNT */}
            <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
            </span>

            {/* NEXT BUTTON */}
            {currentPage < totalPages ? (
                <Link
                    href={`${baseUrl}?page=${currentPage + 1}`}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                    Next
                </Link>
            ) : (
                <span className="px-4 py-2 border rounded text-gray-300 cursor-not-allowed">
                    Next
                </span>
            )}
        </div>
    );
}