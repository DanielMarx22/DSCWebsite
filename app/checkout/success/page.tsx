"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("orderId");
    const { clearCart } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // 1. Clear the cart immediately upon successful load
        clearCart();

        // Optional: confetti or analytics events could go here
    }, [clearCart]);

    if (!mounted) return null;

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500">

            {/* Success Icon */}
            <div className="relative">
                <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 rounded-full" />
                <CheckCircle className="w-24 h-24 text-green-500 relative z-10" />
            </div>

            <div className="space-y-4 max-w-lg">
                <h1 className="text-4xl font-extrabold text-white">Payment Successful!</h1>
                <p className="text-gray-400 text-lg">
                    Thank you for your order. We have received your payment and sent a confirmation email to you.
                </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                        <span className="text-gray-400">Order ID</span>
                        <span className="font-mono text-blue-400 font-bold">
                            {orderId ? `#${orderId.slice(0, 8)}...` : "Pending"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Status</span>
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-bold rounded-full">
                            Paid
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Button asChild size="lg" className="w-full rounded-full bg-blue-600 hover:bg-blue-500 text-lg font-bold h-14">
                    <Link href="/products">
                        Continue Shopping <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                </Button>

                {/* Optional: Add a button to view account/orders if you have that page later */}
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <div className="container mx-auto px-4 py-20">
            {/* Suspense is required when using useSearchParams in Next.js Client Components */}
            <Suspense fallback={<div className="text-white text-center">Loading confirmation...</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}