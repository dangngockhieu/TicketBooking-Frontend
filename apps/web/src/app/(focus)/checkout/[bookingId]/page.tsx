"use client";

import { use } from "react";
import { CheckoutView } from "@/features/booking/components/checkout-view";

export default function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  return <CheckoutView bookingId={bookingId} />;
}
