import { Suspense } from "react";
import { PaymentResultView } from "@/features/payment/components/payment-result-view";

export default function PaymentResultPage() {
  return (
    <Suspense>
      <PaymentResultView />
    </Suspense>
  );
}
