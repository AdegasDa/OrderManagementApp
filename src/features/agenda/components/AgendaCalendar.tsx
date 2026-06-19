"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import type { EventClickArg, DatesSetArg, DayCellContentArg } from "@fullcalendar/core";
import ptLocale from "@fullcalendar/core/locales/pt";

interface Props {
  eventCounts: Record<string, number>;
  selectedDate: string | null;
  onDaySelect: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

export function AgendaCalendar({ eventCounts, selectedDate, onDaySelect, onMonthChange }: Props) {
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
        .agenda-calendar .fc-daygrid-day-frame {
          overflow: visible;
          min-height: 0 !important;
          height: 62px;
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
        .agenda-calendar .fc-daygrid-day-top {
          justify-content: center;
          padding: 0;
          flex: none;
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
          font-size: 1.15rem !important;
          font-weight: 600 !important;
        }
        .agenda-calendar .fc-col-header-cell-cushion,
        .agenda-calendar .fc-daygrid-day-number {
          color: hsl(var(--foreground));
          text-decoration: none;
          font-size: 0.9rem;
        }
        .agenda-calendar .fc-day-other {
          background: hsl(var(--card)) !important;
        }
        .agenda-calendar .fc-day-today {
          background: hsl(var(--accent) / 0.3) !important;
        }
        .agenda-calendar .fc-day-today .fc-daygrid-day-number {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-radius: 50%;
          width: 26px;
          height: 26px;
          display: inline-flex;
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
        events={[]}
        dateClick={(arg: DateClickArg) => onDaySelect(arg.dateStr)}
        eventClick={(arg: EventClickArg) => onDaySelect(arg.event.startStr)}
        dayCellContent={(arg: DayCellContentArg) => {
          const d = arg.date;
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const count = eventCounts[key] ?? 0;
          return (
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px" }}>
              <span className="fc-daygrid-day-number" style={{ lineHeight: 1 }}>{arg.dayNumberText}</span>
              {count > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-6px",
                  minWidth: "16px",
                  height: "16px",
                  padding: "0 3px",
                  borderRadius: "999px",
                  fontSize: "10px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "hsl(0 0% 90%)",
                  color: "hsl(0 0% 20%)",
                  lineHeight: 1,
                }}>
                  {count}
                </span>
              )}
            </div>
          );
        }}
        dayCellClassNames={(arg) => arg.dateStr === selectedDate ? ["fc-day-selected"] : []}
        datesSet={handleDatesSet}
        headerToolbar={{ left: "prev", center: "title", right: "next" }}
        height="auto"
        showNonCurrentDates={false}
        fixedWeekCount={false}
      />
    </div>
  );
}
