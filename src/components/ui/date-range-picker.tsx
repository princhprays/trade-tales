import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              "bg-white dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-700",
              "hover:bg-gray-50 dark:hover:bg-gray-700",
              "hover:border-gray-300 dark:hover:border-gray-600",
              "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
              "transition-colors duration-200",
              !value && "text-gray-500 dark:text-gray-400"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg" 
          align="start"
          sideOffset={4}
        >
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Select date range</h3>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={1}
            className="p-3"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "relative flex items-center justify-center min-h-[40px] w-full",
              caption_label: "absolute left-1/2 -translate-x-1/2 text-sm font-medium text-gray-900 dark:text-white z-10",
              nav: "w-full flex justify-between items-center absolute left-0 top-1/2 -translate-y-1/2 px-2 z-20",
              nav_button: cn(
                "h-9 w-9 bg-transparent p-0 flex items-center justify-center rounded-full transition-all duration-150",
                "text-gray-500 dark:text-gray-300 text-xl font-bold",
                "hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/40 dark:hover:text-blue-400",
                "focus:bg-blue-200 focus:text-blue-700 dark:focus:bg-blue-800/60 dark:focus:text-blue-300",
                "shadow-sm hover:shadow-md focus:shadow-md",
                "opacity-80 hover:opacity-100 focus:opacity-100"
              ),
              nav_button_previous: "",
              nav_button_next: "",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-gray-500 dark:text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: cn(
                "h-9 w-9 text-center text-sm p-0 relative",
                "[&:has([aria-selected].day-range-end)]:rounded-r-md",
                "[&:has([aria-selected].day-outside)]:bg-gray-100/50 dark:[&:has([aria-selected].day-outside)]:bg-gray-800/50",
                "[&:has([aria-selected])]:bg-gray-100 dark:[&:has([aria-selected])]:bg-gray-800",
                "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                "focus-within:relative focus-within:z-20"
              ),
              day: cn(
                "h-9 w-9 p-0 font-normal",
                "text-gray-900 dark:text-white",
                "hover:bg-gray-100 dark:hover:bg-gray-700",
                "rounded-md transition-colors",
                "aria-selected:opacity-100"
              ),
              day_range_end: "day-range-end",
              day_selected: cn(
                "bg-blue-600 text-white hover:bg-blue-700 hover:text-white",
                "dark:bg-blue-500 dark:hover:bg-blue-600",
                "focus:bg-blue-600 focus:text-white",
                "dark:focus:bg-blue-500 dark:focus:text-white"
              ),
              day_today: "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white",
              day_outside: cn(
                "day-outside text-gray-500 opacity-50",
                "aria-selected:bg-gray-100/50 aria-selected:text-gray-500 aria-selected:opacity-30",
                "dark:text-gray-400 dark:aria-selected:bg-gray-800/50 dark:aria-selected:text-gray-400"
              ),
              day_disabled: "text-gray-500 opacity-50 dark:text-gray-400",
              day_range_middle: cn(
                "aria-selected:bg-gray-100 aria-selected:text-gray-900",
                "dark:aria-selected:bg-gray-800 dark:aria-selected:text-white"
              ),
              day_hidden: "invisible",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
} 