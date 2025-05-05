"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

// Define props interface
interface DatePickerProps {
  value?: Date;
  onDateChange?: (date: Date | undefined) => void;
  // You can add other HTML attributes if needed, e.g., extending React.HTMLAttributes<HTMLDivElement>
  // className?: string;
}

export default function DatePicker({ value, onDateChange }: DatePickerProps) {
  // Remove internal state
  // const [date, setDate] = React.useState<Date>();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          // Make className usage consistent if needed, or remove if not extending HTMLAttributes
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {/* Use value prop */}
          {value ? format(value, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* Use value and onDateChange props */}
        <Calendar
          mode="single"
          selected={value}
          onSelect={onDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
