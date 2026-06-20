import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SettingsDisclosureGroupProps {
  children: React.ReactNode;
  className?: string;
  defaultValue?: string[];
}

export function SettingsDisclosureGroup({
  children,
  className,
  defaultValue = [],
}: SettingsDisclosureGroupProps) {
  return (
    <Accordion
      type="multiple"
      defaultValue={defaultValue}
      className={cn("space-y-5", className)}
    >
      {children}
    </Accordion>
  );
}

interface SettingsDisclosureProps {
  value: string;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsDisclosure({
  value,
  title,
  description,
  trailing,
  children,
}: SettingsDisclosureProps) {
  return (
    <AccordionItem
      value={value}
      className="overflow-hidden rounded-[10px] border border-border/70 bg-card shadow-sm"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 data-[state=open]:bg-muted/30 [&[data-state=open]>svg]:rotate-180">
        <div className="flex flex-1 items-center gap-3 pr-2 text-left">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="text-[13px] font-medium text-foreground">
              {title}
            </div>
            {description ? (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {trailing ? (
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {trailing}
            </div>
          ) : null}
        </div>
      </AccordionTrigger>
      <AccordionContent className="border-t border-border/60 px-4 pb-4 pt-3">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
