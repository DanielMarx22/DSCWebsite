"use client";

import { processSquarePayment } from "@/app/checkout/payment-action";
import { useEffect, useState } from "react";

// 1. Define the interface for the props
interface PaymentProps {
    total: number;
}

export default function PaymentForm({ total }: PaymentProps) { // 2. Destructure total here
    const [card, setCard] = useState<any>(null);

    useEffect(() => {
        const startSquare = async () => {
            if (!window.Square) return;

            const payments = window.Square.payments(
                process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID!,
                process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
            );

            try {
                const cardElement = await payments.card();
                await cardElement.attach("#card-container");
                setCard(cardElement);
            } catch (e) {
                console.error("Square Card Error:", e);
            }
        };

        startSquare();
    }, []);

    const handlePayment = async () => {
        if (!card) return;
        const result = await card.tokenize();
        if (result.status === "OK") {
            const charge = await processSquarePayment(result.token, total);

            if (charge.success) {
                alert("Payment Successful! Real money has been moved.");
                // Clear cart or redirect to success page
            } else {
                alert("Payment Failed: " + charge.error);
            }
        }
    };

    return (
        <div className="mt-8 space-y-6 p-8 border border-gray-800 bg-gray-900/60 rounded-3xl backdrop-blur-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Secure Payment</h2>
                <div className="flex gap-2">
                    {/* Visual indicators for the owner/customer */}
                    <div className="h-6 w-10 bg-gray-800 rounded border border-gray-700 flex items-center justify-center text-[10px] text-gray-500 font-bold uppercase">Visa</div>
                    <div className="h-6 w-10 bg-gray-800 rounded border border-gray-700 flex items-center justify-center text-[10px] text-gray-500 font-bold uppercase">MC</div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Card Details</label>
                {/* This container will now have a subtle border 
          and some padding to look better on the dark UI 
      */}
                <div
                    id="card-container"
                    className="p-4 bg-white rounded-xl shadow-inner min-h-[90px] transition-all focus-within:ring-2 focus-within:ring-blue-500"
                />
            </div>

            <button
                onClick={handlePayment}
                className="w-full py-5 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-blue-900/40 active:scale-[0.98]"
            >
                Place Order • ${total.toFixed(2)}
            </button>

            <p className="text-[10px] text-gray-500 text-center uppercase tracking-tighter">
                Protected by Square SSL Encryption
            </p>
        </div>
    );
}