"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { ProductCard } from "@/components/product-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
// 👇 ADDED: MapPin and Info icons
import {
  Truck,
  Store,
  AlertCircle,
  CalendarDays,
  MapPin,
  Info,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import { getSimilarProducts } from "@/app/actions/get-similar-products";
import {
  addDays,
  format,
  parseISO,
  isBefore,
  setHours,
  setMinutes,
  isSameDay,
} from "date-fns";
import "react-day-picker/dist/style.css";
import PaymentForm, { PaymentFormHandle } from "@/components/payment-form";
import { processSquarePayment } from "@/app/checkout/payment-action";

interface CheckoutSettings {
  allowedShippingDays: string[];
  cutoffHour: number;
  blackoutDates?: string[];
  maxBookingWindowDays: number;
  pickupWarning: string;
  flatRateShipping: number;
  taxRate: number;
  // 👇 NEW: Notes from Sanity
  restrictionNote?: string;
  shippingNote?: string;
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
  paymentMethods: string[];
}

export default function CheckoutClient({
  recommendations: initialRecs,
  settings,
  paymentMethods,
}: Props) {
  const { items, removeItem, updateQuantity } = useCartStore();
  const [smartRecs, setSmartRecs] = useState<Product[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<"ship" | "pickup">(
    "ship"
  );

  // 👇 NEW: Name State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  // 👇 NEW: Shipping Address State
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  useEffect(() => {
    const fetchRecs = async () => {
      if (items.length === 0) return;
      const cartIds = items.map((i) => i.id);
      const similar = await getSimilarProducts(cartIds);
      if (similar.length > 0) {
        setSmartRecs(similar);
      }
    };
    fetchRecs();
  }, [items]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentFormRef = useRef<PaymentFormHandle>(null);

  const activeSettings: CheckoutSettings = {
    allowedShippingDays: settings?.allowedShippingDays || ["1", "2", "3"],
    cutoffHour: settings?.cutoffHour ?? 17,
    blackoutDates: settings?.blackoutDates || [],
    maxBookingWindowDays: settings?.maxBookingWindowDays || 30,
    pickupWarning:
      settings?.pickupWarning || "Pickup is available at our store location.",
    flatRateShipping: settings?.flatRateShipping ?? 39.99,
    taxRate: settings?.taxRate ?? 0,
    // 👇 Map new notes
    restrictionNote: settings?.restrictionNote,
    shippingNote: settings?.shippingNote,
  };

  const router = useRouter();

  const { disabledDays, maxDate } = useMemo(() => {
    const now = new Date();
    const today = new Date();
    const cutoffTime = setMinutes(
      setHours(new Date(), activeSettings.cutoffHour),
      0
    );
    const allowedArrivalDays = activeSettings.allowedShippingDays.map((day) =>
      ((parseInt(day) + 1) % 7).toString()
    );

    const max = addDays(today, activeSettings.maxBookingWindowDays);
    const blackoutDates = (activeSettings.blackoutDates || []).map((d) =>
      parseISO(d)
    );

    const disabled = [
      { before: addDays(today, 1) },
      { after: max },
      (date: Date) => {
        const dayOfWeek = date.getDay().toString();
        if (isSameDay(date, addDays(today, 1)) && isBefore(cutoffTime, now))
          return true;
        return !allowedArrivalDays.includes(dayOfWeek);
      },
      ...blackoutDates,
    ];
    return { disabledDays: disabled, maxDate: max };
  }, [activeSettings]);

  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shipping =
    deliveryMethod === "ship" ? activeSettings.flatRateShipping : 0;
  const estimatedTax = subtotal * (activeSettings.taxRate / 100);
  const total = subtotal + shipping + estimatedTax;

  // 👇 UPDATED: Validation Logic (Added Name & Address checks)
  const isFormValid = useMemo(() => {
    if (items.length === 0) return false;
    if (!email || !email.includes("@")) return false;
    if (!firstName || !lastName) return false; // Name check

    // Address Check (only if shipping)
    if (deliveryMethod === "ship") {
      if (!address || !city || !state || !zip || !selectedDate) return false;
    }

    // If pickup, we don't need address/date check (pickup is implicit)
    // NOTE: Your original code required date for shipping, keeping that logic.
    return true;
  }, [
    items,
    email,
    firstName,
    lastName,
    deliveryMethod,
    selectedDate,
    address,
    city,
    state,
    zip,
  ]);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      const paymentResult = await paymentFormRef.current?.submitPayment();

      if (!paymentResult || paymentResult.error) {
        alert("Payment Failed: " + (paymentResult?.error || "Unknown error"));
        setIsProcessing(false);
        return;
      }

      const token = paymentResult.token!;

      // 👇 Prepare Name & Address
      const fullName = `${firstName} ${lastName}`.trim();
      const shippingAddress =
        deliveryMethod === "ship"
          ? {
              addressLine1: address,
              city,
              state,
              postalCode: zip,
            }
          : undefined;

      // 👇 Pass new arguments to Server Action
      const charge = await processSquarePayment(
        token,
        items,
        { email, name: fullName },
        marketingConsent,
        activeSettings.taxRate,
        deliveryMethod,
        shippingAddress
      );

      if (charge.success && charge.payment) {
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
        <Link
          href="/products"
          className="inline-block bg-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-500 transition-colors"
        >
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
          {/* Contact Info Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">Contact Info</h2>
            <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl space-y-4">
              {/* 👇 NEW: Name Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="firstName"
                    className="text-gray-300 mb-2 block"
                  >
                    First Name
                  </Label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="lastName"
                    className="text-gray-300 mb-2 block"
                  >
                    Last Name
                  </Label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-300 mb-2 block">
                  Email Address (for receipt)
                </Label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

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
                  <label
                    htmlFor="marketing"
                    className="font-medium text-gray-300 cursor-pointer select-none"
                  >
                    Keep me updated on new arrivals and exclusive offers
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-bold text-white">Delivery Options</h2>
            <RadioGroup
              defaultValue="ship"
              onValueChange={(val) => {
                setDeliveryMethod(val as "ship" | "pickup");
                setSelectedDate(undefined);
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Label
                htmlFor="ship"
                // 👇 Changed class to flex-col to accommodate note
                className={`flex flex-col p-4 border rounded-xl cursor-pointer transition-all ${deliveryMethod === "ship" ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500" : "border-gray-800 bg-gray-900/50"}`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="ship" id="ship" />
                    <span className="font-semibold text-white text-base">
                      Ship
                    </span>
                  </div>
                  <Truck className="w-5 h-5 text-blue-400" />
                </div>
                {/* 👇 NEW: Restriction Note */}
                {activeSettings.restrictionNote && (
                  <span className="text-xs text-blue-300 pl-7">
                    {activeSettings.restrictionNote}
                  </span>
                )}
              </Label>

              <Label
                htmlFor="pickup"
                className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${deliveryMethod === "pickup" ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500" : "border-gray-800 bg-gray-900/50"}`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <span className="font-semibold text-white text-base">
                    Local Pick up
                  </span>
                </div>
                <Store className="w-5 h-5 text-gray-400" />
              </Label>
            </RadioGroup>

            {/* 👇 NEW: Shipping Address Form (Only shows if shipping) */}
            {deliveryMethod === "ship" && (
              <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2 text-blue-400 font-bold border-b border-gray-800 pb-2 mb-2">
                  <MapPin className="w-4 h-4" /> Shipping Address
                </div>
                <div>
                  <Label htmlFor="address" className="text-gray-300 mb-2 block">
                    Address Line 1
                  </Label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Coral Way"
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-3">
                    <Label htmlFor="city" className="text-gray-300 mb-2 block">
                      City
                    </Label>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Mobile"
                      className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor="state" className="text-gray-300 mb-2 block">
                      State
                    </Label>
                    <input
                      id="state"
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="AL"
                      maxLength={2}
                      className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none uppercase text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="zip" className="text-gray-300 mb-2 block">
                      Zip Code
                    </Label>
                    <input
                      id="zip"
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="36608"
                      maxLength={5}
                      className="w-full bg-gray-950 border border-gray-800 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-2xl">
              {deliveryMethod === "pickup" ? (
                <div className="flex gap-3 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl text-sm">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <p className="text-blue-100">
                    {activeSettings.pickupWarning}
                  </p>
                </div>
              ) : (
                <div className="calendar-dark">
                  {/* 👇 UPDATED: Header with Shipping Note */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                      <CalendarDays className="w-5 h-5" /> Select Arrival Date
                    </h3>
                    {activeSettings.shippingNote && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
                        <Info className="w-3 h-3 text-blue-400" />
                        {activeSettings.shippingNote}
                      </div>
                    )}
                  </div>

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
                        disabled: {
                          color: "#26267aa8",
                          opacity: "0.5",
                          cursor: "not-allowed",
                        },
                        selected: { color: "white" },
                        today: { color: "#313cffff", fontWeight: "900" },
                      }}
                      classNames={{
                        day: "text-white font-bold p-2 hover:bg-gray-800 rounded-md transition-colors",
                        selected:
                          "!bg-blue-700 !text-white !rounded-full !border-none !outline-none !ring-0",
                        caption:
                          "text-white flex justify-center py-2 mb-4 font-bold text-lg",
                        head_cell: "text-gray-400 font-medium pb-2",
                        nav_button:
                          "text-gray-400 hover:text-white transition-colors",
                      }}
                    />
                  </div>
                  {selectedDate && (
                    <p className="mt-4 text-sm text-blue-300 text-center font-bold italic tracking-wide">
                      Your order will arrive on:{" "}
                      {format(selectedDate, "EEEE, MMM do")}
                    </p>
                  )}
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
                    const categoryPath =
                      item.category === "uncategorized" ? "all" : item.category;
                    if (item.slug)
                      router.push(`/products/${categoryPath}/${item.slug}`);
                  }}
                  className="group relative flex gap-4 sm:gap-6 border-b border-gray-800 pb-6 items-center hover:bg-white/[0.03] cursor-pointer transition-colors rounded-xl p-2"
                >
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
                      <div className="text-sm mb-2 font-medium">
                        {item.originalPrice &&
                          item.originalPrice > item.price && (
                            <span className="text-gray-500 line-through mr-2">
                              ${item.originalPrice.toFixed(2)}
                            </span>
                          )}
                        <span className="text-gray-300">
                          ${item.price.toFixed(2)} x {item.quantity}
                        </span>
                      </div>

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
                        <span className="text-white font-bold min-w-[20px] text-center">
                          {item.quantity}
                        </span>
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
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes ({activeSettings.taxRate}%)</span>
                <span>${estimatedTax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-800 pt-4 flex justify-between text-white font-bold text-2xl">
                <span>Total</span>
                <span>USD ${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={!isFormValid || isProcessing}
              className={`w-full py-5 font-black text-lg rounded-2xl transition-all shadow-xl 
                    ${
                      !isFormValid || isProcessing
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed grayscale"
                        : "bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white shadow-blue-900/40 active:scale-[0.98]"
                    }
                `}
            >
              {isProcessing
                ? "Processing..."
                : deliveryMethod === "ship" && !selectedDate
                  ? "Select Arrival Date"
                  : `Pay Now • $${total.toFixed(2)}`}
            </button>

            <p className="text-[10px] text-gray-500 text-center uppercase tracking-tighter mt-4">
              Protected by Square SSL Encryption
            </p>
          </div>
        </div>
      </div>

      {(smartRecs.length > 0 || (initialRecs && initialRecs.length > 0)) && (
        <div className="mt-24 border-t border-gray-800 pt-16">
          <h2 className="text-2xl font-bold mb-10 text-white">
            {smartRecs.length > 0
              ? "Picked Just For You"
              : "You Might Also Like"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {(smartRecs.length > 0 ? smartRecs : initialRecs).map((product) => (
              <ProductCard key={product._id} data={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
