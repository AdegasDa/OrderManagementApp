import { getOrderStatuses } from "@/features/statuses/actions";
import { StatusList } from "@/features/statuses/components/StatusList";

export default async function StatusesPage() {
  const statuses = await getOrderStatuses();
  return (
    <div className="p-6">
      <StatusList statuses={statuses} />
    </div>
  );
}
