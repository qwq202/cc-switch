import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export interface ToggleRowProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  variant?: "card" | "plain";
}

export function ToggleRow({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
  variant = "card",
}: ToggleRowProps) {
  if (variant === "plain") {
    return (
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0 flex-1 space-y-0.5 pr-4">
          <p className="text-[13px] font-medium leading-snug text-foreground">
            {title}
          </p>
          {description ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-label={title}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/50 p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-3">
        {icon ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background ring-1 ring-border">
            {icon}
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">{title}</p>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={title}
        className={cn(disabled && "opacity-60")}
      />
    </div>
  );
}
