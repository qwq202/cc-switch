import { cn } from "@/lib/utils";

interface SettingSectionProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  className?: string;
  /** 内嵌自定义内容（无行分隔线，带内边距） */
  inset?: boolean;
}

export function SettingSection({
  title,
  footer,
  children,
  className,
  inset = false,
}: SettingSectionProps) {
  return (
    <section className={cn("space-y-1.5", className)}>
      {title ? (
        <h3 className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      ) : null}
      <div className="overflow-hidden rounded-[10px] border border-border/70 bg-card shadow-sm">
        {inset ? (
          <div className="p-4">{children}</div>
        ) : (
          <div className="divide-y divide-border/60">{children}</div>
        )}
      </div>
      {footer ? (
        <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
          {footer}
        </p>
      ) : null}
    </section>
  );
}

interface SettingsPaneProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** @deprecated 全页设置模式下已不再限制宽度 */
  wide?: boolean;
}

export function SettingsPane({ title, subtitle, children }: SettingsPaneProps) {
  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-[13px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

interface SettingsNoteProps {
  children: React.ReactNode;
  variant?: "info" | "warning";
  className?: string;
}

export function SettingsNote({
  children,
  variant = "info",
  className,
}: SettingsNoteProps) {
  return (
    <p
      className={cn(
        "rounded-lg px-3 py-2.5 text-[11px] leading-relaxed",
        variant === "warning"
          ? "border border-yellow-500/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
          : "bg-muted/50 text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
