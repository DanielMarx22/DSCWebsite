"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  ArrowRight,
  Printer,
  Mail,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { getOrderDetails } from "./actions";
import { sendReceiptEmail } from "@/app/actions/send-receipt";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { clearCart } = useCartStore();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // 1. Clear cart immediately
    clearCart();

    // 2. Fetch Order Data
    if (orderId) {
      getOrderDetails(orderId).then((res) => {
        if (res.success) {
          setData(res);
        }
        setLoading(false);
      });
    }
  }, [orderId, clearCart]);

  const handleSendEmail = async () => {
    if (!data?.order || !data?.email) return;

    setIsSending(true);
    // Pass empty array for images (images are only available during checkout session)
    const result = await sendReceiptEmail(data.email, data.order, []);
    setIsSending(false);

    if (result.success) {
      setEmailSent(true);
    } else {
      alert("Failed to send email. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-white animate-pulse">
        Loading receipt details...
      </div>
    );
  }

  if (!data || !data.order) {
    return (
      <div className="text-center py-20 text-white">
        <h1 className="text-2xl font-bold mb-4">Order not found</h1>
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  // 👇 Destructure 'sales' from data
  const { order, recommendations, sales, email } = data;

  const total = (Number(order.totalMoney?.amount || 0) / 100).toFixed(2);
  const tax = (Number(order.totalTaxMoney?.amount || 0) / 100).toFixed(2);

  return (
    <div className="min-h-screen py-12 space-y-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 rounded-full" />
          <CheckCircle className="w-20 h-20 text-green-500 relative z-10" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-400 text-lg mb-2">
            Order #{order.id.slice(0, 8)}
          </p>

          {emailSent ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/30 border border-blue-800 text-blue-200 text-sm font-medium animate-in fade-in zoom-in">
              <Mail className="w-4 h-4" />
              Receipt sent to {email}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Thank you for your purchase.
            </p>
          )}
        </div>
      </div>

      {/* RECEIPT CARD */}
      <div className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
          <h2 className="font-bold text-white text-lg">Receipt</h2>
          <span className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Line Items */}
        <div className="p-6 space-y-6">
          <ul className="space-y-4">
            {order.lineItems?.map((item: any, i: number) => (
              <li
                key={i}
                className="flex justify-between items-center text-gray-300"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{item.quantity}x</span>
                  <span>{item.name}</span>
                </div>
                <span className="font-mono">
                  ${(Number(item.basePriceMoney?.amount || 0) / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-800 my-4" />

          {/* Totals */}
          <div className="space-y-2 text-right">
            <div className="flex justify-between text-gray-500 text-sm">
              <span>Tax</span>
              <span>${tax}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-xl pt-2">
              <span>Total</span>
              <span>${total}</span>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="p-6 bg-gray-950/50 border-t border-gray-800 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 2. CONTINUE SHOPPING (Blue Button) */}
            <Button
              asChild
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12"
            >
              <Link href="/products">
                Shop Again <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            {/* 3. EMAIL ME BUTTON */}
            <Button
              onClick={handleSendEmail}
              disabled={isSending || emailSent || !email}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white h-12"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending
                  Email...
                </>
              ) : emailSent ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />{" "}
                  Receipt Sent Successfully
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" /> Email Me A Copy (
                  {email || "No Email"})
                </>
              )}
            </Button>
          </div>

          {/* Help Link */}
          <div className="text-center pt-2">
            <Button
              asChild
              variant="link"
              className="text-gray-500 hover:text-white"
            >
              <Link href="/contact">
                <HelpCircle className="w-4 h-4 mr-2" /> Need help with this
                order?
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* RECOMMENDATIONS SECTION */}
      {recommendations.length > 0 && (
        <div className="border-t border-gray-800 pt-12">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recommendations.map((product: any) => (
              // 👇 CRITICAL FIX: Pass 'sales' prop here
              <ProductCard key={product._id} data={product} sales={sales} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="container mx-auto px-4">
      <Suspense
        fallback={
          <div className="text-white text-center py-20">Loading...</div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
