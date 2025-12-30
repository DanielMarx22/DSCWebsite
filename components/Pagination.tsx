"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, FormEvent } from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [inputPage, setInputPage] = useState("");

    const createPageUrl = (pageNumber: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", pageNumber.toString());
        return `${baseUrl}?${params.toString()}`;
    };

    const handleJump = (e: FormEvent) => {
        e.preventDefault();
        const pageNumber = Number(inputPage);

        if (pageNumber >= 1 && pageNumber <= totalPages) {
            router.push(createPageUrl(pageNumber));
            setInputPage("");
        }
    };

    // REMOVED: The check that hid the component on single pages.
    // It now renders always.

    return (
        <div className="flex justify-center items-center gap-6 mt-12 mb-8 text-white select-none">

            {/* 1. PREVIOUS BUTTON */}
            {currentPage > 1 ? (
                <Link
                    href={createPageUrl(currentPage - 1)}
                    className="px-5 py-2 border border-gray-600 rounded hover:bg-gray-800 transition-colors"
                >
                    &larr; Previous
                </Link>
            ) : (
                <span className="px-5 py-2 border border-gray-800 rounded text-gray-600 cursor-not-allowed">
                    &larr; Previous
                </span>
            )}

            {/* 2. CENTER CONTROL */}
            <div className="flex items-center gap-3 bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-800">
                <span className="text-sm font-medium text-gray-300">
                    Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
                </span>

                {/* Divider */}
                <div className="h-4 w-px bg-gray-700"></div>

                {/* Input (Disabled if only 1 page to avoid confusion, optional) */}
                <form onSubmit={handleJump}>
                    <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={inputPage}
                        onChange={(e) => setInputPage(e.target.value)}
                        disabled={totalPages <= 1}
                        className={`w-12 bg-transparent text-center text-white focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none ${totalPages <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="#"
                    />
                </form>
            </div>

            {/* 3. NEXT BUTTON */}
            {currentPage < totalPages ? (
                <Link
                    href={createPageUrl(currentPage + 1)}
                    className="px-5 py-2 border border-gray-600 rounded hover:bg-gray-800 transition-colors"
                >
                    Next &rarr;
                </Link>
            ) : (
                <span className="px-5 py-2 border border-gray-800 rounded text-gray-600 cursor-not-allowed">
                    Next &rarr;
                </span>
            )}

        </div>
    );
}