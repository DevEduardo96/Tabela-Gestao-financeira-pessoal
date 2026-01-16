"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

// Tipagem extraída para melhor legibilidade
export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  // Memoizando formatadores para evitar re-renders
  const memoizedFormatters = React.useMemo(
    () => ({
      formatMonthDropdown: (date: Date) =>
        date.toLocaleString("default", { month: "short" }),
      ...formatters,
    }),
    [formatters],
  );

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background p-3 [--cell-size:2rem]",
        "rtl:[&_.rdp-button_next>svg]:rotate-180 rtl:[&_.rdp-button_previous>svg]:rotate-180", // Simplificado
        className,
      )}
      captionLayout={captionLayout}
      formatters={memoizedFormatters}
      classNames={{
        ...defaultClassNames, // Spread inicial para limpar o código abaixo
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months,
        ),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        // ... mantenha as outras classes conforme sua necessidade de UI
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...props }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeftIcon
              : orientation === "right"
                ? ChevronRightIcon
                : ChevronDownIcon;
          return <Icon className={cn("size-4", className)} {...props} />;
        },
        DayButton: MemoizedCalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

// Memoized para performance em calendários densos
const CalendarDayButton = ({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) => {
  const ref = React.useRef<HTMLButtonElement>(null);

  // Sincroniza o foco apenas quando necessário
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      // Usando data-attributes de forma mais limpa
      data-selected-single={modifiers.selected && !modifiers.range_middle}
      className={cn(
        "relative flex aspect-square h-auto w-full min-w-[--cell-size] flex-col font-normal",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        "group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-ring",
        className,
      )}
      {...props}
    />
  );
};

const MemoizedCalendarDayButton = React.memo(CalendarDayButton);

export { Calendar };
