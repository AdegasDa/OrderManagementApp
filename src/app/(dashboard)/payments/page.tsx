export const dynamic = "force-dynamic";

import { getPaymentTypes } from "@/features/payments/actions";
import { PaymentTypeList } from "@/features/payments/components/PaymentTypeList";

export default async function PaymentsPage() {
  const paymentTypes = await getPaymentTypes();
  return (
    <div className="px-4 py-4 md:p-6">
      <PaymentTypeList paymentTypes={paymentTypes} />
    </div>
  );
}
