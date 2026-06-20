import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequestLogs } from "@/lib/query/usage";
import {
  getFreshInputTokens,
  isUnpricedUsage,
  type LogFilters,
  type UsageRangeSelection,
} from "@/types/usage";
import { ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
import {
  fmtInt,
  fmtUsd,
  getLocaleFromLanguage,
  parseFiniteNumber,
} from "./format";

import { cn } from "@/lib/utils";

interface RequestLogTableProps {
  range: UsageRangeSelection;
  appType?: string;
  providerName?: string;
  model?: string;
  refreshIntervalMs: number;
  statusCode?: number;
}

export function RequestLogStatusFilter({
  value,
  onChange,
}: {
  value?: number;
  onChange: (statusCode: number | undefined) => void;
}) {
  const { t } = useTranslation();

  return (
    <Select
      value={value?.toString() || "all"}
      onValueChange={(v) => {
        const parsed = Number.parseInt(v, 10);
        onChange(v === "all" || !Number.isFinite(parsed) ? undefined : parsed);
      }}
    >
      <SelectTrigger
        className="h-9 w-auto shrink-0 gap-2 rounded-lg border-border/60 bg-background px-3 text-[13px] shadow-none focus:ring-1 [&>span]:line-clamp-1"
        title={t("usage.statusCode")}
      >
        <ListFilter className="h-4 w-4 shrink-0 text-muted-foreground" />
        <SelectValue placeholder={t("usage.statusCode")} />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="all">{t("common.all")}</SelectItem>
        <SelectItem value="200">200 OK</SelectItem>
        <SelectItem value="400">400</SelectItem>
        <SelectItem value="401">401</SelectItem>
        <SelectItem value="429">429</SelectItem>
        <SelectItem value="500">500</SelectItem>
      </SelectContent>
    </Select>
  );
}

function formatLogTime(ts: number, locale: string): string {
  return new Date(ts * 1000).toLocaleString(locale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ code }: { code: number }) {
  const ok = code >= 200 && code < 300;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-[2.25rem] items-center justify-center rounded-md px-1.5 text-[11px] font-semibold tabular-nums",
        ok
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/10 text-red-600 dark:text-red-400",
      )}
    >
      {code}
    </span>
  );
}

export function RequestLogTable({
  range,
  appType: dashboardAppType,
  providerName,
  model,
  refreshIntervalMs,
  statusCode,
}: RequestLogTableProps) {
  const { t, i18n } = useTranslation();

  // 应用/Provider/模型筛选已上移到 Dashboard 顶栏（全局生效）；
  // 状态码筛选在 Dashboard Tab 行，可由父组件受控传入。
  const effectiveStatusCode = statusCode;
  const [page, setPage] = useState(0);
  const [pageInput, setPageInput] = useState("");
  const pageSize = 20;

  const effectiveFilters: LogFilters = {
    appType:
      dashboardAppType && dashboardAppType !== "all"
        ? dashboardAppType
        : undefined,
    providerName,
    model,
    statusCode: effectiveStatusCode,
  };

  const { data: result, isLoading } = useRequestLogs({
    filters: effectiveFilters,
    range,
    page,
    pageSize,
    options: {
      refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    },
  });

  const logs = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  useEffect(() => {
    setPage(0);
  }, [
    dashboardAppType,
    providerName,
    model,
    range.customEndDate,
    range.customStartDate,
    range.preset,
    effectiveStatusCode,
  ]);

  const handleGoToPage = () => {
    const trimmed = pageInput.trim();
    if (!/^\d+$/.test(trimmed)) return;
    const parsed = Number(trimmed);
    if (parsed < 1 || parsed > totalPages) return;
    setPage(parsed - 1);
    setPageInput("");
  };

  const language = i18n.resolvedLanguage || i18n.language || "en";
  const locale = getLocaleFromLanguage(language);

  const headCell =
    "h-8 whitespace-nowrap px-3 py-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground";
  const bodyCell = "whitespace-nowrap px-3 py-2.5 text-[13px] align-middle";

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="h-[360px] animate-pulse rounded-[10px] bg-muted/40" />
      ) : (
        <>
          <div className="overflow-hidden rounded-[10px] border border-border/70 bg-card">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className={cn(headCell, "text-left w-[88px]")}>
                    {t("usage.time")}
                  </TableHead>
                  <TableHead
                    className={cn(headCell, "text-left min-w-[120px]")}
                  >
                    {t("usage.provider")}
                  </TableHead>
                  <TableHead
                    className={cn(headCell, "text-left max-w-[200px]")}
                  >
                    {t("usage.billingModel")}
                  </TableHead>
                  <TableHead className={cn(headCell, "text-right")}>
                    {t("usage.inputTokens")}
                  </TableHead>
                  <TableHead className={cn(headCell, "text-right")}>
                    {t("usage.outputTokens")}
                  </TableHead>
                  <TableHead className={cn(headCell, "text-right w-[72px]")}>
                    {t("usage.totalCost")}
                  </TableHead>
                  <TableHead className={cn(headCell, "text-right w-[88px]")}>
                    {t("usage.timingInfo")}
                  </TableHead>
                  <TableHead className={cn(headCell, "text-right w-[52px]")}>
                    {t("usage.status")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={8}
                      className="py-14 text-center text-[13px] text-muted-foreground"
                    >
                      {t("usage.noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const unpriced = isUnpricedUsage(log);
                    const freshInput = getFreshInputTokens(log);
                    const modelTitle =
                      log.requestModel && log.requestModel !== log.model
                        ? `${log.requestModel} → ${log.model}`
                        : log.model;
                    const cacheHint = [
                      log.cacheReadTokens > 0 &&
                        `R${fmtInt(log.cacheReadTokens, locale)}`,
                      log.cacheCreationTokens > 0 &&
                        `W${fmtInt(log.cacheCreationTokens, locale)}`,
                    ]
                      .filter(Boolean)
                      .join("·");
                    const multiplier = parseFiniteNumber(log.costMultiplier);
                    const latencySec = (log.latencyMs / 1000).toFixed(1);
                    const ttftSec =
                      log.firstTokenMs != null
                        ? (log.firstTokenMs / 1000).toFixed(1)
                        : null;

                    return (
                      <TableRow
                        key={log.requestId}
                        className="border-border/40 hover:bg-muted/25"
                      >
                        <TableCell
                          className={cn(
                            bodyCell,
                            "text-left tabular-nums text-muted-foreground",
                          )}
                        >
                          {formatLogTime(log.createdAt, locale)}
                        </TableCell>
                        <TableCell className={cn(bodyCell, "text-left")}>
                          <div
                            className="max-w-[140px] truncate font-medium text-foreground"
                            title={log.providerName || undefined}
                          >
                            {log.providerName || t("usage.unknownProvider")}
                          </div>
                          <div
                            className="mt-0.5 truncate text-[11px] text-muted-foreground"
                            title={log.dataSource || "proxy"}
                          >
                            {log.dataSource || "proxy"}
                          </div>
                        </TableCell>
                        <TableCell className={cn(bodyCell, "text-left")}>
                          <div
                            className="max-w-[200px] truncate font-mono text-[12px] text-foreground/90"
                            title={modelTitle}
                          >
                            {log.requestModel &&
                            log.requestModel !== log.model ? (
                              <>
                                <span>{log.requestModel}</span>
                                <span className="text-muted-foreground">
                                  {" → "}
                                </span>
                                <span>{log.model}</span>
                              </>
                            ) : (
                              log.model
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={cn(bodyCell, "text-right")}>
                          <span
                            className="tabular-nums text-foreground"
                            title={
                              log.inputTokens !== freshInput
                                ? `Raw: ${log.inputTokens.toLocaleString()}`
                                : undefined
                            }
                          >
                            {fmtInt(freshInput, locale)}
                            {cacheHint ? (
                              <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                                {cacheHint}
                              </span>
                            ) : null}
                          </span>
                        </TableCell>
                        <TableCell
                          className={cn(
                            bodyCell,
                            "text-right tabular-nums text-foreground",
                          )}
                        >
                          {fmtInt(log.outputTokens, locale)}
                        </TableCell>
                        <TableCell className={cn(bodyCell, "text-right")}>
                          <span
                            className={cn(
                              "tabular-nums",
                              unpriced
                                ? "text-[12px] text-muted-foreground"
                                : "font-medium text-foreground",
                            )}
                          >
                            {unpriced
                              ? t("usage.unpriced", "未定价")
                              : fmtUsd(log.totalCostUsd, 4)}
                          </span>
                          {multiplier != null && multiplier !== 1 ? (
                            <span className="ml-1 text-[11px] text-muted-foreground">
                              ×{multiplier.toFixed(2)}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell
                          className={cn(
                            bodyCell,
                            "text-right tabular-nums text-[12px]",
                          )}
                        >
                          <span className="text-foreground">{latencySec}s</span>
                          {ttftSec ? (
                            <span className="text-muted-foreground">
                              /{ttftSec}s
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className={cn(bodyCell, "text-right")}>
                          <StatusBadge code={log.statusCode} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-foreground">
            <span>{t("usage.totalRecords", { total })}</span>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {(() => {
                const pages: (number | string)[] = [];
                if (totalPages <= 9) {
                  for (let i = 0; i < totalPages; i++) pages.push(i);
                } else {
                  const pageSet = new Set<number>();
                  for (let i = 0; i < 3; i++) pageSet.add(i);
                  for (let i = totalPages - 3; i < totalPages; i++)
                    pageSet.add(i);
                  for (
                    let i = Math.max(0, page - 1);
                    i <= Math.min(totalPages - 1, page + 1);
                    i++
                  )
                    pageSet.add(i);
                  const sorted = Array.from(pageSet).sort((a, b) => a - b);
                  for (let i = 0; i < sorted.length; i++) {
                    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
                      pages.push(`ellipsis-${i}`);
                    }
                    pages.push(sorted[i]);
                  }
                }
                return pages.map((p) =>
                  typeof p === "string" ? (
                    <span key={p} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setPage(p)}
                    >
                      {p + 1}
                    </Button>
                  ),
                );
              })()}
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 ml-2">
                <Input
                  type="text"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGoToPage();
                  }}
                  placeholder={t("usage.pageInputPlaceholder")}
                  className="h-8 w-16 text-center text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={handleGoToPage}
                >
                  {t("usage.goToPage")}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
