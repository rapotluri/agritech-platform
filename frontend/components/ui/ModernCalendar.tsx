"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, subMonths, setYear } from "date-fns";

interface ModernCalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  fromYear?: number;
  toYear?: number;
  className?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function ModernCalendar({
  selected,
  onSelect,
  fromYear = 1900,
  toYear = 2100,
  className
}: ModernCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = React.useState<Date>(selected || today);
  const [showYearGrid, setShowYearGrid] = React.useState(false);
  const yearGridRows = 3;
  const yearGridCols = 4;
  const yearGridSize = yearGridRows * yearGridCols;
  // Track the start year of the year grid
  const [yearGridStart, setYearGridStart] = React.useState<number>(() => {
    const currentYear = (selected || today).getFullYear();
    return Math.max(fromYear, currentYear - Math.floor(yearGridSize / 2));
  });

  // Generate the days for the current month
  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const startDay = (startOfMonth.getDay() + 6) % 7;
  const daysInMonth = endOfMonth.getDate();

  // For year grid
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Handlers
  const handlePrev = () => {
    if (showYearGrid) {
      setYearGridStart((prev) => Math.max(fromYear, prev - yearGridSize));
    } else {
      setViewDate(subMonths(viewDate, 1));
    }
  };
  const handleNext = () => {
    if (showYearGrid) {
      setYearGridStart((prev) => Math.min(toYear - yearGridSize + 1, prev + yearGridSize));
    } else {
      setViewDate(addMonths(viewDate, 1));
    }
  };
  const handleDayClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    onSelect?.(date);
  };
  const handleYearClick = (year: number) => {
    setViewDate(setYear(viewDate, year));
    setShowYearGrid(false);
  };
  // When opening the year grid, center it on the current year
  const handleShowYearGrid = () => {
    const centerStart = Math.max(fromYear, currentYear - Math.floor(yearGridSize / 2));
    setYearGridStart(centerStart);
    setShowYearGrid(true);
  };

  // Render days grid
  const days: (number | null)[] = Array(startDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );
  while (days.length % 7 !== 0) days.push(null);

  // Render year grid (centered on yearGridStart)
  const yearGrid = Array.from({ length: yearGridSize }, (_, i) => yearGridStart + i)
    .filter(y => y >= fromYear && y <= toYear);

  return (
    <div className={cn("rounded-xl shadow-lg border bg-white p-4 w-[320px]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          onClick={handlePrev}
          aria-label="Previous Month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          className="text-base font-semibold px-2 py-1 rounded hover:bg-gray-100"
          onClick={() => showYearGrid ? setShowYearGrid(false) : handleShowYearGrid()}
        >
          {MONTHS[currentMonth]} {currentYear}
        </button>
        <button
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          onClick={handleNext}
          aria-label="Next Month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      {/* Year grid popover */}
      {showYearGrid ? (
        <div className="grid grid-cols-4 gap-2 py-2">
          {yearGrid.map((year) => (
            <button
              key={year}
              className={cn(
                "h-9 w-full rounded font-medium text-sm",
                year === currentYear
                  ? "bg-primary text-white"
                  : "hover:bg-gray-100 text-gray-700"
              )}
              onClick={() => handleYearClick(year)}
            >
              {year}
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Weekdays (start with Monday) */}
          <div className="grid grid-cols-7 mb-1 text-xs text-gray-400 font-semibold">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <div key={d} className="w-10 h-6 flex items-center justify-center">
                {d}
              </div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => (
              <button
                key={i}
                disabled={day === null}
                className={cn(
                  "h-9 w-9 flex items-center justify-center rounded-full text-sm font-medium",
                  day === null && "bg-transparent cursor-default",
                  day && selected &&
                    selected.getFullYear() === currentYear &&
                    selected.getMonth() === currentMonth &&
                    selected.getDate() === day
                    ? "bg-primary text-white font-bold"
                    : day
                    ? "hover:bg-gray-100 text-gray-900"
                    : "text-gray-300"
                )}
                onClick={() => day && handleDayClick(day)}
              >
                {day || ""}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 