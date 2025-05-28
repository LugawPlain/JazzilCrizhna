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

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface CalendarSelectMonthProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const CalendarSelectMonth: React.FC<CalendarSelectMonthProps> = ({
  currentDate,
  onDateChange,
}) => {
  return (
    <Select
      value={format(currentDate, "MMMM")}
      onValueChange={(month) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(MONTHS.indexOf(month));
        onDateChange(newDate);
      }}
    >
      <SelectTrigger className="w-[140px] bg-neutral-700 border-neutral-600">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MONTHS.map((month) => (
          <SelectItem key={month} value={month}>
            {month}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CalendarSelectMonth;
