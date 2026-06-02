import { getPaymentTypes } from "@/features/payments/actions";
import { PaymentTypeList } from "@/features/payments/components/PaymentTypeList";

export default async function PaymentsPage() {
  const paymentTypes = await getPaymentTypes();
  return (
    <div className="p-6">
      <PaymentTypeList paymentTypes={paymentTypes} />
    </div>
  );
}
