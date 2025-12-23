"use client";

import { useEffect, useState, useImperativeHandle, forwardRef, useRef } from "react";

export interface PaymentFormHandle {
    submitPayment: () => Promise<{ token?: string; error?: string }>;
}

interface PaymentFormProps {
    allowedMethods: string[];
    onMethodSelect: (method: string) => void;
}

const PaymentForm = forwardRef<PaymentFormHandle, PaymentFormProps>(
    ({ allowedMethods = [], onMethodSelect }, ref) => {
        const [selectedMethod, setSelectedMethod] = useState<string>("card");
        const [status, setStatus] = useState("Loading payment secure fields...");
        const cardRef = useRef<any>(null);

        useImperativeHandle(ref, () => ({
            async submitPayment() {
                if (!cardRef.current) return { error: "Payment form is not ready yet." };
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
            let timeoutId: NodeJS.Timeout;
            let intervalId: NodeJS.Timeout;

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
                    setStatus(""); // Success! Clear loading message
                } catch (e) {
                    console.error("Square Init Failed:", e);
                    setStatus("Failed to load payment form. Please refresh.");
                }
            };

            // Check for Square every 500ms
            const checkSquare = () => {
                // @ts-ignore
                if (window.Square) {
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);
                    initializeSquare();
                }
            };

            intervalId = setInterval(checkSquare, 500);

            // Stop waiting after 10 seconds and show error
            timeoutId = setTimeout(() => {
                clearInterval(intervalId);
                if (status.includes("Loading")) {
                    setStatus("Error: Payment script failed to load. Check your connection.");
                }
            }, 10000);

            return () => {
                clearInterval(intervalId);
                clearTimeout(timeoutId);
            };
        }, []);

        const renderIcon = (type: string, label: string) => {
            if (!allowedMethods.includes(type)) return null;
            const isSelected = selectedMethod === type;
            return (
                <div
                    onClick={() => { setSelectedMethod(type); onMethodSelect(type); }}
                    className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 transition-all ${isSelected ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500" : "border-gray-700 bg-gray-900 hover:bg-gray-800"
                        }`}
                >
                    <div className="font-bold uppercase text-xs text-gray-300">{label}</div>
                </div>
            );
        };

        return (
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Payment Method</h2>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {renderIcon("visa", "Visa")}
                    {renderIcon("mastercard", "Mastercard")}
                    {renderIcon("amex", "Amex")}
                    {renderIcon("venmo", "Venmo")}
                    {renderIcon("giftcard", "Gift Card")}
                </div>

                <div className="relative min-h-[100px]">
                    {/* Show status message if loading or error */}
                    {status && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900/80 rounded-xl">
                            <p className="text-sm text-yellow-500 font-mono animate-pulse">{status}</p>
                        </div>
                    )}

                    {/* The white box for the card input */}
                    <div className="p-4 bg-white rounded-xl shadow-inner min-h-[50px]">
                        <div id="card-container" />
                    </div>
                </div>
            </div>
        );
    }
);

PaymentForm.displayName = "PaymentForm";
export default PaymentForm;