import React from "react";
import type { AppId } from "@/lib/api/types";
import { APP_IDS, APP_ICON_MAP } from "@/config/appConfig";

interface AppCountBarProps {
  totalLabel: string;
  counts: Partial<Record<AppId, number>>;
  appIds?: AppId[];
}

export const AppCountBar: React.FC<AppCountBarProps> = ({
  totalLabel,
  counts,
  appIds = APP_IDS,
}) => {
  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-4 py-3">
      <span className="text-sm font-medium text-foreground whitespace-nowrap">
        {totalLabel}
      </span>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {appIds.map((app) => {
          const count = counts[app] ?? 0;
          return (
            <span
              key={app}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800/60 px-1.5 h-5 text-[11px] text-zinc-500 dark:text-zinc-400"
            >
              <span className="flex items-center justify-center [&>svg]:size-3">
                {APP_ICON_MAP[app].icon}
              </span>
              <span className="tabular-nums font-medium">{count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
