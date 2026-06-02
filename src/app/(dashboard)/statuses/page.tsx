"use client";

import { useEffect, useState } from "react";
import { getOrderStatuses } from "@/features/statuses/actions";
import { StatusList } from "@/features/statuses/components/StatusList";
import type { OrderStatus } from "@/lib/types";

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);

  useEffect(() => { getOrderStatuses().then(setStatuses); }, []);

  return (
    <div className="p-6">
      <StatusList statuses={statuses} />
    </div>
  );
}
