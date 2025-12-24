"use client";

import { useEffect, useState, useImperativeHandle, forwardRef, useRef } from "react";

export interface PaymentFormHandle {
    submitPayment: () => Promise<{ token?: string; error?: string }>;
}

interface PaymentFormProps {
    allowedMethods: string[];
    onMethodSelect: (method: string) => void;
}

// Helper to map Square's official brand names to your Sanity IDs
const SQUARE_TO_SANITY_MAP: Record<string, string> = {
    VISA: "visa",
    MASTERCARD: "mastercard",
    AMERICAN_EXPRESS: "amex",
    DISCOVER: "discover",
    JCB: "jcb",
    DINERS_CLUB: "diners",
    UNIONPAY: "unionpay",
};

const PaymentForm = forwardRef<PaymentFormHandle, PaymentFormProps>(
    ({ allowedMethods = [], onMethodSelect }, ref) => {
        const [status, setStatus] = useState("Loading payment secure fields...");
        const [cardError, setCardError] = useState<string | null>(null);
        const cardRef = useRef<any>(null);

        useImperativeHandle(ref, () => ({
            async submitPayment() {
                if (!cardRef.current) return { error: "Payment form is not ready yet." };

                // 1. Block submission if there is a validation error (e.g. Amex not allowed)
                if (cardError) {
                    return { error: cardError };
                }

                try {
                    const result = await cardRef.current.tokenize();
                    if (result.status === "OK") {
                        return { token: result.token };
                    } else {
                        return { error: result.errors[0].message };
                    }
                } catch (e: any) {
                    return { error: e.message };
                }
            }
        }));

        useEffect(() => {
            let intervalId: NodeJS.Timeout;
            let timeoutId: NodeJS.Timeout;

            const initializeSquare = async () => {
                if (!process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID) {
                    setStatus("Error: Missing Square App ID");
                    return;
                }

                try {
                    // @ts-ignore
                    const payments = window.Square.payments(
                        process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
                        process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
                    );

                    const card = await payments.card();
                    await card.attach("#card-container");
                    cardRef.current = card;
                    setStatus("");

                    // --- NEW: LISTEN FOR CARD BRAND CHANGES ---
                    // As the user types, Square tells us the brand (e.g. VISA, AMERICAN_EXPRESS)
                    card.addEventListener('change', (event: any) => {
                        const brand = event.detail.brand; // e.g. "AMERICAN_EXPRESS"

                        // If Square detects a brand, and it's NOT "UNKNOWN"
                        if (brand && brand !== 'UNKNOWN') {
                            const sanityKey = SQUARE_TO_SANITY_MAP[brand];

                            // If we can map it, and it's NOT in the allowed list from Sanity
                            if (sanityKey && !allowedMethods.includes(sanityKey)) {
                                setCardError(`We do not accept ${brand.replace('_', ' ')}. Please use a different card.`);
                            } else {
                                setCardError(null); // Clear error if valid
                            }
                        }
                    });

                } catch (e) {
                    console.error("Square Init Failed:", e);
                    setStatus("Failed to load payment form. Please refresh.");
                }
            };

            const checkSquare = () => {
                // @ts-ignore
                if (window.Square) {
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);
                    initializeSquare();
                }
            };

            intervalId = setInterval(checkSquare, 500);
            timeoutId = setTimeout(() => {
                clearInterval(intervalId);
                if (status.includes("Loading")) {
                    setStatus("Error: Payment script failed to load.");
                }
            }, 10000);

            return () => {
                clearInterval(intervalId);
                clearTimeout(timeoutId);
            };
        }, [allowedMethods]);

        // Simple display helper
        const renderIcon = (type: string, label: string) => {
            if (!allowedMethods.includes(type)) return null;
            return (
                <div className="opacity-80 grayscale hover:grayscale-0 transition-all" title={`We accept ${label}`}>
                    {/* You can replace this div with an actual <img> or <svg> later */}
                    <div className="border border-gray-700 bg-gray-800 rounded px-2 py-1 text-[10px] font-bold uppercase text-gray-300">
                        {label}
                    </div>
                </div>
            );
        };

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Payment Details</h2>

                    {/* "We Accept" Banner */}
                    <div className="flex gap-2">
                        {renderIcon("visa", "Visa")}
                        {renderIcon("mastercard", "MC")}
                        {renderIcon("amex", "Amex")}
                        {renderIcon("discover", "Disc")}
                    </div>
                </div>

                <div className="relative min-h-[100px]">
                    {status && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900/80 rounded-xl">
                            <p className="text-sm text-yellow-500 font-mono animate-pulse">{status}</p>
                        </div>
                    )}

                    <div className={`p-4 bg-white rounded-xl shadow-inner min-h-[50px] transition-all ${cardError ? "ring-2 ring-red-500" : ""}`}>
                        <div id="card-container" />
                    </div>

                    {/* VALIDATION WARNING */}
                    {cardError && (
                        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
                            <span className="text-red-400 font-bold text-sm">⚠️ {cardError}</span>
                        </div>
                    )}
                </div>

                <p className="text-xs text-gray-500">
                    Securely processed by Square. Your card information is never stored on our servers.
                </p>
            </div>
        );
    }
);

PaymentForm.displayName = "PaymentForm";
export default PaymentForm;