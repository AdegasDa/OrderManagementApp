"use client";

import { useEffect, useState } from "react";
import { getClients } from "@/features/clients/actions";
import { ClientList } from "@/features/clients/components/ClientList";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => { getClients().then(setClients); }, []);

  return (
    <div className="p-6">
      <ClientList clients={clients} />
    </div>
  );
}
