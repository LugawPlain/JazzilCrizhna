// src/components/CalendarSelectYear.tsx
"use client";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

const YEARS = Array.from(
  { length: 10 },
  (_, i) => new Date().getFullYear() + i
);

interface CalendarSelectYearProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const CalendarSelectYear: React.FC<CalendarSelectYearProps> = ({
  currentDate,
  onDateChange,
}) => {
  return (
    <Select
      value={format(currentDate, "yyyy")}
      onValueChange={(year) => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(parseInt(year));
        onDateChange(newDate);
      }}
    >
      <SelectTrigger className="w-[100px] bg-neutral-700 border-neutral-600">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {YEARS.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CalendarSelectYear;
