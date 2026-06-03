export const dynamic = "force-dynamic";

import { getOrderStatuses } from "@/features/statuses/actions";
import { StatusList } from "@/features/statuses/components/StatusList";

export default async function StatusesPage() {
  const statuses = await getOrderStatuses();
  return (
    <div className="px-4 py-4 md:p-6">
      <StatusList statuses={statuses} />
    </div>
  );
}
