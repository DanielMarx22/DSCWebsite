"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { ProductCard } from "@/components/product-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Truck, Store, AlertCircle, CalendarDays } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { addDays, format, parseISO, isBefore, setHours, setMinutes, isSameDay } from "date-fns";
import "react-day-picker/dist/style.css";
import PaymentForm, { PaymentFormHandle } from "@/components/payment-form";
import { processSquarePayment } from "@/app/checkout/payment-action";
import { Checkbox } from "@/components/ui/checkbox"; // Assuming you have shadcn, or use standard input

interface CheckoutSettings {
  allowedShippingDays: string[];
  cutoffHour: number;
  blackoutDates?: string[];
  maxBookingWindowDays: number;
  pickupWarning: string;
  flatRateShipping: number;
  taxRate: number;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  category: string;
  inventory: number;
}

interface Props {
  recommendations: Product[];
  settings: CheckoutSettings | null;
  paymentMethods: string[]; // 👈 Passed from Sanity
}

export default function CheckoutClient({ recommendations, settings, paymentMethods }: Props) {
  const { items, removeItem, updateQuantity } = useCartStore();
  const [deliveryMethod, setDeliveryMethod] = useState<"ship" | "pickup">("ship");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("card");
  const [isProcessing, setIsProcessing] = useState(false);

  // Ref to trigger the child component payment submission
  const paymentFormRef = useRef<PaymentFormHandle>(null);

  const activeSettings: CheckoutSettings = {
    allowedShippingDays: settings?.allowedShippingDays || ["1", "2", "3"],
    cutoffHour: settings?.cutoffHour ?? 17,
    blackoutDates: settings?.blackoutDates || [],
    maxBookingWindowDays: settings?.maxBookingWindowDays || 30,
    pickupWarning: settings?.pickupWarning || "Pickup is available at our store location.",
    flatRateShipping: settings?.flatRateShipping ?? 39.99,
    taxRate: settings?.taxRate ?? 0,
  };

  const router = useRouter();

  const { disabledDays, maxDate } = useMemo(() => {
    const now = new Date();
    const today = new Date();
    const cutoffTime = setMinutes(setHours(new Date(), activeSettings.cutoffHour), 0);
    const allowedArrivalDays = activeSettings.allowedShippingDays.map(day =>
      ((parseInt(day) + 1) % 7).toString()
    );

    const max = addDays(today, activeSettings.maxBookingWindowDays);
    const blackoutDates = (activeSettings.blackoutDates || []).map(d => parseISO(d));

    const disabled = [
      { before: addDays(today, 1) },
      { after: max },
      (date: Date) => {
        const dayOfWeek = date.getDay().toString();
        if (isSameDay(date, addDays(today, 1)) && isBefore(cutoffTime, now)) return true;
        return !allowedArrivalDays.includes(dayOfWeek);
      },
      ...blackoutDates
    ];
    return { disabledDays: disabled, maxDate: max };
  }, [activeSettings]);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = deliveryMethod === "ship" ? activeSettings.flatRateShipping : 0;
  const estimatedTax = subtotal * (activeSettings.taxRate / 100);
  const total = subtotal + shipping + estimatedTax;
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Validation: Button is only active if these pass
  const isFormValid = useMemo(() => {
    if (items.length === 0) return false;
    if (!email || !email.includes("@")) return false; // 👈 Add this check
    if (deliveryMethod === "ship" && !selectedDate) return false;
    return true;
  }, [items, email, deliveryMethod, selectedDate]);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      // 1. Trigger Tokenization in Child Component
      const paymentResult = await paymentFormRef.current?.submitPayment();

      if (!paymentResult || paymentResult.error) {
        alert("Payment Failed: " + (paymentResult?.error || "Unknown error"));
        setIsProcessing(false);
        return;
      }

      const token = paymentResult.token!;

      // 2. Send Token to Server Action
      // Pass the new boolean to the server action
      const charge = await processSquarePayment(token, items, email, marketingConsent); // 👈 Pass consent

      if (charge.success && charge.payment) { // FIX: Check if payment exists
        // Redirect to success page
        window.location.href = `/checkout/success?orderId=${charge.payment.id}`;
      } else {
        alert("Transaction Declined: " + (charge.error || "Unknown error"));
      }

    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Your Cart is Empty</h1>
        <Link href="/products" className="inline-block bg-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-500 transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 text-white bg-black min-h-screen">
      <h1 className="text-3xl font-bold mb-10 text-white">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-10">

          {/* NEW: Contact Info Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">Contact Info</h2>
            <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-300 mb-2 block">Email Address (for receipt)</Label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              {/* 👇 NEW: Marketing Checkbox */}
              <div className="flex items-start space-x-3 pt-2">
                <div className="flex items-center h-6">
                  <input
                    id="marketing"
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-700 bg-gray-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
                  />
                </div>
                <div className="text-sm">
                  <label htmlFor="marketing" className="font-medium text-gray-300 cursor-pointer select-none">
                    Keep me updated on new arrivals and exclusive offers
                  </label>
                  <p className="text-gray-500 text-xs mt-1">
                    We promise not to spam. You can unsubscribe at any time.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-bold text-white">Delivery Options</h2>
            <RadioGroup
              defaultValue="ship"
              onValueChange={(val) => { setDeliveryMethod(val as "ship" | "pickup"); setSelectedDate(undefined); }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Label htmlFor="ship" className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${deliveryMethod === "ship" ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500" : "border-gray-800 bg-gray-900/50"}`}>
                <div className="flex items-center gap-3"><RadioGroupItem value="ship" id="ship" /><span className="font-semibold text-white text-base">Ship</span></div><Truck className="w-5 h-5 text-blue-400" />
              </Label>
              <Label htmlFor="pickup" className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${deliveryMethod === "pickup" ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500" : "border-gray-800 bg-gray-900/50"}`}>
                <div className="flex items-center gap-3"><RadioGroupItem value="pickup" id="pickup" /><span className="font-semibold text-white text-base">Local Pick up</span></div><Store className="w-5 h-5 text-gray-400" />
              </Label>
            </RadioGroup>

            <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-2xl">
              {deliveryMethod === "pickup" ? (
                <div className="flex gap-3 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl text-sm">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" /><p className="text-blue-100">{activeSettings.pickupWarning}</p>
                </div>
              ) : (
                <div className="calendar-dark">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-400"><CalendarDays className="w-5 h-5" /> Select Arrival Date</h3>
                  {/* MOBILE FIX: Changed p-6 to p-2 sm:p-6 and added overflow-x-auto */}
                  <div className="flex justify-center bg-transparent p-2 sm:p-6 rounded-xl border border-gray-800 shadow-inner overflow-x-auto">
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={disabledDays}
                      fromDate={addDays(new Date(), 1)}
                      toDate={maxDate}
                      modifiers={{ disabled: disabledDays }}
                      modifiersStyles={{
                        disabled: { color: "#26267aa8", opacity: "0.5", cursor: "not-allowed" },
                        selected: { color: "white" },
                        today: { color: "#313cffff", fontWeight: "900" }
                      }}
                      classNames={{
                        day: "text-white font-bold p-2 hover:bg-gray-800 rounded-md transition-colors",
                        selected: "!bg-blue-700 !text-white !rounded-full !border-none !outline-none !ring-0",
                        caption: "text-white flex justify-center py-2 mb-4 font-bold text-lg",
                        head_cell: "text-gray-400 font-medium pb-2",
                        nav_button: "text-gray-400 hover:text-white transition-colors",
                      }}
                    />
                  </div>
                  {selectedDate && <p className="mt-4 text-sm text-blue-300 text-center font-bold italic tracking-wide">Your order will arrive on: {format(selectedDate, "EEEE, MMM do")}</p>}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-bold text-white">Your Order</h2>
            <ul className="space-y-6">
              {items.map((item) => (
                <li
                  key={item.id}
                  onClick={() => {
                    // Fallback to 'all' if uncategorized to prevent broken link
                    const categoryPath = item.category === "uncategorized" ? "all" : item.category;
                    if (item.slug) {
                      router.push(`/products/${categoryPath}/${item.slug}`);
                    }
                  }}
                  className="group relative flex gap-4 sm:gap-6 border-b border-gray-800 pb-6 items-center hover:bg-white/[0.03] cursor-pointer transition-colors rounded-xl p-2"
                >
                  {/* Product Image */}
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
                    <Image
                      src={item.imageUrl || ""}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2 font-medium">
                        ${item.price.toFixed(2)} x {item.quantity}
                      </p>

                      {/* QUANTITY CONTROLS */}
                      <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 w-fit rounded-lg px-2 py-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, "decrease");
                          }}
                          className="text-gray-400 hover:text-white px-2 text-xl font-bold transition-colors"
                        >
                          −
                        </button>
                        <span className="text-white font-bold min-w-[20px] text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, "increase");
                          }}
                          className="text-gray-400 hover:text-white px-2 text-xl font-bold transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <p className="font-bold text-xl text-blue-400">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="text-xs text-red-500 hover:text-red-400 hover:underline transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* PAYMENT FORM SECTION */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border border-gray-800 bg-gray-900/60 rounded-3xl backdrop-blur-sm shadow-2xl">
              {/* We pass the ref so the sidebar button can trigger this */}
              <PaymentForm
                ref={paymentFormRef}
                allowedMethods={paymentMethods}
                onMethodSelect={setSelectedPaymentMethod}
              />
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
        <div className="lg:w-96 flex-shrink-0">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 sticky top-24 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-white">Order Summary</h2>
            <div className="space-y-4 mb-6 text-gray-300">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Taxes</span><span>${estimatedTax.toFixed(2)}</span></div>
              <div className="border-t border-gray-800 pt-4 flex justify-between text-white font-bold text-2xl">
                <span>Total</span><span>USD ${total.toFixed(2)}</span>
              </div>
            </div>

            {/* NEW PAY BUTTON - Logic controlled here */}
            <button
              onClick={handlePlaceOrder}
              disabled={!isFormValid || isProcessing}
              className={`w-full py-5 font-black text-lg rounded-2xl transition-all shadow-xl 
                    ${!isFormValid || isProcessing
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed grayscale"
                  : "bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white shadow-blue-900/40 active:scale-[0.98]"
                }
                `}
            >
              {isProcessing ? "Processing..." : deliveryMethod === "ship" && !selectedDate ? "Select Arrival Date" : `Pay Now • $${total.toFixed(2)}`}
            </button>

            <p className="text-[10px] text-gray-500 text-center uppercase tracking-tighter mt-4">
              Protected by Square SSL Encryption
            </p>
          </div>
        </div>
      </div>

      {recommendations && recommendations.length > 0 && (
        <div className="mt-24 border-t border-gray-800 pt-16">
          <h2 className="text-2xl font-bold mb-10 text-white">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {recommendations.map((product) => (
              <ProductCard key={product._id} data={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}