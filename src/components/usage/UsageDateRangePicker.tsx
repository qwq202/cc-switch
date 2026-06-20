import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getUsageRangePresetLabel, resolveUsageRange } from "@/lib/usageRange";
import { getLocaleFromLanguage } from "./format";
import type { UsageRangePreset, UsageRangeSelection } from "@/types/usage";

type DraftField = "start" | "end";

const PRESETS: UsageRangePreset[] = ["today", "1d", "7d", "14d", "30d"];

interface UsageDateRangePickerProps {
  selection: UsageRangeSelection;
  onApply: (selection: UsageRangeSelection) => void;
  triggerLabel: string;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toTs(d: Date): number {
  return Math.floor(d.getTime() / 1000);
}

function fromTs(ts: number): Date {
  return new Date(ts * 1000);
}

function fmtTime(ts: number): string {
  const d = fromTs(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtShortDate(ts: number, locale: string): string {
  return fromTs(ts).toLocaleDateString(locale, {
    month: "numeric",
    day: "numeric",
  });
}

function parseTimeInput(ts: number, value: string): number {
  const [h, min] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return ts;
  const base = fromTs(ts);
  return toTs(
    new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, min),
  );
}

function setDateKeepTime(ts: number, day: Date): number {
  const base = fromTs(ts);
  return toTs(
    new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      base.getHours(),
      base.getMinutes(),
    ),
  );
}

function getCalendarDays(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export function UsageDateRangePicker({
  selection,
  onApply,
  triggerLabel,
}: UsageDateRangePickerProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeField, setActiveField] = useState<DraftField>("start");
  const resolvedRange = useMemo(
    () => resolveUsageRange(selection),
    [selection],
  );
  const [draftStart, setDraftStart] = useState(resolvedRange.startDate);
  const [draftEnd, setDraftEnd] = useState(resolvedRange.endDate);
  const [draftPreset, setDraftPreset] = useState<UsageRangePreset | null>(
    selection.preset !== "custom" ? selection.preset : null,
  );
  const [displayMonth, setDisplayMonth] = useState(
    () =>
      new Date(
        fromTs(resolvedRange.startDate).getFullYear(),
        fromTs(resolvedRange.startDate).getMonth(),
        1,
      ),
  );
  const [error, setError] = useState<string | null>(null);

  const language = i18n.resolvedLanguage || i18n.language || "en";
  const locale = getLocaleFromLanguage(language);

  useEffect(() => {
    if (!open) return;
    const r = resolveUsageRange(selection);
    setDraftStart(r.startDate);
    setDraftEnd(r.endDate);
    setDraftPreset(selection.preset !== "custom" ? selection.preset : null);
    setDisplayMonth(
      new Date(
        fromTs(r.startDate).getFullYear(),
        fromTs(r.startDate).getMonth(),
        1,
      ),
    );
    setActiveField("start");
    setError(null);
  }, [open, selection]);

  const calendarDays = useMemo(
    () => getCalendarDays(displayMonth),
    [displayMonth],
  );

  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(
          new Date(2024, 0, 7 + i),
        ),
      ),
    [locale],
  );

  const startDay = fromTs(draftStart);
  const endDay = fromTs(draftEnd);
  const today = new Date();
  const sameDay = isSameDay(startDay, endDay);

  const handleDatePick = (day: Date) => {
    setError(null);
    setDraftPreset(null);
    const nextTs = setDateKeepTime(
      activeField === "start" ? draftStart : draftEnd,
      day,
    );

    if (activeField === "start") {
      setDraftStart(nextTs);
      if (nextTs > draftEnd) {
        setDraftEnd(nextTs);
      }
      setActiveField("end");
    } else if (nextTs < draftStart) {
      setDraftStart(nextTs);
      setActiveField("end");
    } else {
      setDraftEnd(nextTs);
    }

    if (
      day.getMonth() !== displayMonth.getMonth() ||
      day.getFullYear() !== displayMonth.getFullYear()
    ) {
      setDisplayMonth(new Date(day.getFullYear(), day.getMonth(), 1));
    }
  };

  const handlePresetPick = (preset: (typeof PRESETS)[number]) => {
    setError(null);
    const r = resolveUsageRange({ preset });
    setDraftPreset(preset);
    setDraftStart(r.startDate);
    setDraftEnd(r.endDate);
    setDisplayMonth(
      new Date(
        fromTs(r.startDate).getFullYear(),
        fromTs(r.startDate).getMonth(),
        1,
      ),
    );
    setActiveField("start");
  };

  const handleApply = () => {
    setError(null);
    if (draftStart > draftEnd) {
      setError(t("usage.invalidTimeRangeOrder", "开始时间不能晚于结束时间"));
      return;
    }
    if (draftPreset && PRESETS.includes(draftPreset)) {
      onApply({ preset: draftPreset });
    } else {
      onApply({
        preset: "custom",
        customStartDate: draftStart,
        customEndDate: draftEnd,
      });
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-9 min-w-[100px] justify-between gap-1.5 rounded-lg border-border/70 bg-background px-2.5 text-xs font-medium shadow-none",
            selection.preset === "custom" &&
              "border-primary/40 bg-primary/5 text-primary",
          )}
          title={triggerLabel}
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <span className="truncate">{triggerLabel}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[236px] overflow-hidden rounded-lg border-border/70 p-0 shadow-md"
        align="end"
        sideOffset={4}
      >
        {/* 快捷预设：预览范围，点确定后生效 */}
        <div className="grid grid-cols-5 gap-0.5 border-b border-border/50 p-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={cn(
                "h-6 rounded text-[10px] font-medium transition-colors",
                draftPreset === preset
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
              onClick={() => handlePresetPick(preset)}
            >
              {getUsageRangePresetLabel(preset, t)}
            </button>
          ))}
        </div>

        {/* 日历 */}
        <div className="px-1.5 pt-1.5 pb-1">
          <div className="mb-0.5 flex items-center justify-between">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() =>
                setDisplayMonth(
                  new Date(
                    displayMonth.getFullYear(),
                    displayMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] font-medium tabular-nums">
              {displayMonth.toLocaleDateString(locale, {
                year: "numeric",
                month: "short",
              })}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() =>
                setDisplayMonth(
                  new Date(
                    displayMonth.getFullYear(),
                    displayMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 text-center">
            {weekdayLabels.map((label, i) => (
              <div
                key={i}
                className="text-[9px] font-medium text-muted-foreground/70"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const isCurrentMonth = day.getMonth() === displayMonth.getMonth();
              const isToday = isSameDay(day, today);
              const isStart = isSameDay(day, startDay);
              const isEnd = isSameDay(day, endDay);
              const dayStart = startOfDay(day);
              const inRange =
                dayStart >= startOfDay(startDay) &&
                dayStart <= startOfDay(endDay);
              const isEndpoint = isStart || isEnd;
              const isRangeMiddle = inRange && !isEndpoint;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex items-center justify-center",
                    isRangeMiddle && "bg-primary/10",
                    isStart &&
                      inRange &&
                      !sameDay &&
                      "rounded-l-full bg-primary/10",
                    isEnd &&
                      inRange &&
                      !sameDay &&
                      "rounded-r-full bg-primary/10",
                  )}
                >
                  <button
                    type="button"
                    aria-label={day.toLocaleDateString(locale)}
                    aria-pressed={isEndpoint}
                    className={cn(
                      "flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] transition-colors",
                      !isCurrentMonth && "text-muted-foreground/25",
                      isCurrentMonth && !inRange && "hover:bg-muted/80",
                      isRangeMiddle && "text-primary",
                      isEndpoint &&
                        "bg-primary font-medium text-primary-foreground",
                      isStart &&
                        activeField === "start" &&
                        "ring-2 ring-primary/40 ring-offset-1",
                      isEnd &&
                        activeField === "end" &&
                        "ring-2 ring-primary/40 ring-offset-1",
                      isToday && !isEndpoint && "font-medium text-primary",
                    )}
                    onClick={() => handleDatePick(day)}
                  >
                    {day.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部：日期由日历决定，只编辑时间 + 确认 */}
        <div className="space-y-1.5 border-t border-border/50 px-2 py-1.5">
          <div className="flex min-w-0 items-center justify-center gap-1 text-[10px]">
            <button
              type="button"
              className={cn(
                "shrink-0 rounded px-1 py-0.5 tabular-nums transition-colors",
                activeField === "start"
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setActiveField("start")}
            >
              {fmtShortDate(draftStart, locale)}
            </button>
            <Input
              type="time"
              step={60}
              className="h-6 w-[54px] shrink-0 border-0 bg-muted/50 px-0.5 text-[10px] shadow-none focus-visible:ring-1"
              value={fmtTime(draftStart)}
              onChange={(e) => {
                setDraftPreset(null);
                setDraftStart(parseTimeInput(draftStart, e.target.value));
                setError(null);
              }}
              onFocus={() => setActiveField("start")}
            />
            <span className="shrink-0 text-muted-foreground/50">–</span>
            {!sameDay && (
              <button
                type="button"
                className={cn(
                  "shrink-0 rounded px-1 py-0.5 tabular-nums transition-colors",
                  activeField === "end"
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setActiveField("end")}
              >
                {fmtShortDate(draftEnd, locale)}
              </button>
            )}
            <Input
              type="time"
              step={60}
              className="h-6 w-[54px] shrink-0 border-0 bg-muted/50 px-0.5 text-[10px] shadow-none focus-visible:ring-1"
              value={fmtTime(draftEnd)}
              onChange={(e) => {
                setDraftPreset(null);
                setDraftEnd(parseTimeInput(draftEnd, e.target.value));
                setError(null);
              }}
              onFocus={() => setActiveField("end")}
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="h-6 w-full rounded text-[10px]"
            onClick={handleApply}
          >
            {t("common.confirm")}
          </Button>
          {error ? (
            <p className="text-center text-[9px] text-destructive">{error}</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
