"use client";

import { useState, useCallback, useEffect } from "react";
import { AgendaCalendar } from "./AgendaCalendar";
import { DayOrders } from "./DayOrders";
import { getOrderCountsByMonth } from "@/features/orders/actions";

interface Props {
  initialCounts: Record<string, number>;
  initialYear: number;
  initialMonth: number;
}

export function AgendaView({ initialCounts, initialYear, initialMonth }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [eventCounts, setEventCounts] = useState(initialCounts);
  useEffect(() => setEventCounts(initialCounts), [initialCounts]);
  const [visibleYear, setVisibleYear] = useState(initialYear);
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);

  const handleMonthChange = useCallback(
    async (year: number, month: number) => {
      if (year === visibleYear && month === visibleMonth) return;
      setVisibleYear(year);
      setVisibleMonth(month);
      const counts = await getOrderCountsByMonth(year, month);
      setEventCounts(counts);
    },
    [visibleYear, visibleMonth]
  );

  return (
    <div className="space-y-6">
      <AgendaCalendar
        eventCounts={eventCounts}
        selectedDate={selectedDate}
        onDaySelect={setSelectedDate}
        onMonthChange={handleMonthChange}
      />
      <DayOrders selectedDate={selectedDate} />
    </div>
  );
}
