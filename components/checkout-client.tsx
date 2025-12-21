"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { checkoutAction } from "@/app/checkout/checkout-action";
import { ProductCard } from "@/components/product-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Truck, Store, AlertCircle, CalendarDays } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { addDays, format, parseISO, isBefore, setHours, setMinutes, isSameDay } from "date-fns";
import "react-day-picker/dist/style.css";
import PaymentForm from "@/components/payment-form";

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
}

export default function CheckoutClient({ recommendations, settings }: Props) {
  const { items, removeItem, updateQuantity } = useCartStore();
  const [deliveryMethod, setDeliveryMethod] = useState<"ship" | "pickup">("ship");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

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

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Your Cart is Empty</h1>
        <Button asChild size="lg" className="rounded-full">
          <Link href="/products">Start Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 text-white bg-black min-h-screen">
      <h1 className="text-3xl font-bold mb-10 text-white">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-10">
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
                  <div className="flex justify-center bg-transparent p-6 rounded-xl border border-grey-700 shadow-inner">
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
                        // Simplified: let classNames handle the shape and background
                        selected: { color: "white" },
                        today: { color: "#313cffff", fontWeight: "900" }
                      }}
                      classNames={{
                        day: "text-white font-bold p-2 hover:bg-gray-800 rounded-md transition-colors",
                        // Forces the selection to be a blue circle with no square background or ring
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
                    // Ensure we don't navigate if data is still missing
                    if (item.category && item.slug) {
                      router.push(`/products/${item.category}/${item.slug}`);
                    } else {
                      console.error("Missing navigation data for item:", item);
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
                            e.stopPropagation(); // 2. CRITICAL: Prevents navigation when clicking button
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
                            e.stopPropagation(); // 2. CRITICAL: Prevents navigation when clicking button
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
                          e.stopPropagation(); // 2. CRITICAL: Prevents navigation when clicking button
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
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PaymentForm total={total} />
          </section>
        </div>

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
            <form action={checkoutAction}>
              <input type="hidden" name="items" value={JSON.stringify(items)} />
              <input type="hidden" name="arrivalDate" value={selectedDate?.toISOString() || ""} />
              <Button type="submit" size="lg" disabled={deliveryMethod === "ship" && !selectedDate} className="w-full rounded-full bg-blue-600 hover:bg-blue-500 text-lg font-bold py-7 shadow-lg shadow-blue-900/20 disabled:opacity-50">
                {deliveryMethod === "ship" && !selectedDate ? "Select Arrival Date" : "Pay now"}
              </Button>
            </form>
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