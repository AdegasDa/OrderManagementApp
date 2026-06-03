import { getClients } from "@/features/clients/actions";
import { ClientList } from "@/features/clients/components/ClientList";

export default async function ClientsPage() {
  const clients = await getClients();
  return (
    <div className="px-4 py-4 md:p-6">
      <ClientList clients={clients} />
    </div>
  );
}
