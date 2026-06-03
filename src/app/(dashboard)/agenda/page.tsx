export const dynamic = "force-dynamic";

import { getOrderCountsByMonth } from "@/features/orders/actions";
import { AgendaView } from "@/features/agenda/components/AgendaView";

export default async function AgendaPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const counts = await getOrderCountsByMonth(year, month);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-6">Agenda</h1>
      <AgendaView initialCounts={counts} initialYear={year} initialMonth={month} />
    </div>
  );
}
