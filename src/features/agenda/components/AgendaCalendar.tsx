"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import type { EventContentArg, EventClickArg, DatesSetArg } from "@fullcalendar/core";
import ptLocale from "@fullcalendar/core/locales/pt";

interface Props {
  eventCounts: Record<string, number>;
  selectedDate: string | null;
  onDaySelect: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

function EventBlock({ info }: { info: EventContentArg }) {
  const count = info.event.extendedProps.count as number;
  return (
    <div className="flex justify-center w-full py-0.5 px-1">
      <div className="flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground cursor-pointer select-none px-2.5 py-1.5">
        <span className="text-sm font-bold leading-none">{count}</span>
        <span className="text-[10px] font-medium leading-none opacity-85">
          {count === 1 ? "Encomenda" : "Encomendas"}
        </span>
      </div>
    </div>
  );
}

export function AgendaCalendar({ eventCounts, selectedDate, onDaySelect, onMonthChange }: Props) {
  const events = Object.entries(eventCounts).map(([date, count]) => ({
    date,
    title: String(count),
    extendedProps: { count },
  }));

  function handleDatesSet(arg: DatesSetArg) {
    // FullCalendar fires this on every view change; derive the displayed month
    // from the start of the current range (start is the first day visible, which
    // may be from the previous month, so add a few days to land in the target month)
    const mid = new Date(arg.start);
    mid.setDate(mid.getDate() + 7);
    onMonthChange(mid.getFullYear(), mid.getMonth() + 1);
  }

  return (
    <div className="rounded-lg border bg-card p-4 agenda-calendar">
      <style>{`
        .agenda-calendar .fc-daygrid-event-harness {
          margin-top: 2px;
        }
        .agenda-calendar .fc-event {
          border: none !important;
          background: transparent !important;
          padding: 0 2px;
        }
        .agenda-calendar .fc-event-main {
          padding: 0;
        }
        .agenda-calendar .fc-daygrid-day {
          cursor: pointer;
        }
        .agenda-calendar .fc-daygrid-day:hover .fc-daygrid-day-frame {
          background: hsl(var(--accent) / 0.4);
          border-radius: 6px;
        }
        .agenda-calendar .fc-button-primary {
          background-color: hsl(var(--primary)) !important;
          border-color: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
          border-radius: 6px !important;
          font-size: 0.8rem !important;
          padding: 4px 10px !important;
        }
        .agenda-calendar .fc-button-primary:hover { opacity: 0.85; }
        .agenda-calendar .fc-button-primary:disabled { opacity: 0.5; }
        .agenda-calendar .fc-toolbar-title {
          font-size: 1rem !important;
          font-weight: 600 !important;
        }
        .agenda-calendar .fc-col-header-cell-cushion,
        .agenda-calendar .fc-daygrid-day-number {
          color: hsl(var(--foreground));
          text-decoration: none;
          font-size: 0.8rem;
        }
        .agenda-calendar .fc-day-today {
          background: hsl(var(--accent) / 0.3) !important;
        }
        .agenda-calendar .fc-day-today .fc-daygrid-day-number {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .agenda-calendar .fc-day-selected .fc-daygrid-day-frame {
          background: hsl(var(--primary) / 0.12);
          border-radius: 6px;
          outline: 2px solid hsl(var(--primary) / 0.5);
          outline-offset: -2px;
        }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={ptLocale}
        events={events}
        dateClick={(arg: DateClickArg) => onDaySelect(arg.dateStr)}
        eventClick={(arg: EventClickArg) => onDaySelect(arg.event.startStr)}
        eventContent={(info) => <EventBlock info={info} />}
        dayCellClassNames={(arg) => arg.dateStr === selectedDate ? ["fc-day-selected"] : []}
        datesSet={handleDatesSet}
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        height="auto"
        dayMaxEvents={2}
        eventDisplay="block"
      />
    </div>
  );
}
