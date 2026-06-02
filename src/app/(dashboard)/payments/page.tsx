"use client";

import { useEffect, useState } from "react";
import { getPaymentTypes } from "@/features/payments/actions";
import { PaymentTypeList } from "@/features/payments/components/PaymentTypeList";
import type { PaymentType } from "@/lib/types";

export default function PaymentsPage() {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);

  useEffect(() => { getPaymentTypes().then(setPaymentTypes); }, []);

  return (
    <div className="p-6">
      <PaymentTypeList paymentTypes={paymentTypes} />
    </div>
  );
}
