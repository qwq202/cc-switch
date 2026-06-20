import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ProviderIcon } from "@/components/ProviderIcon";
import type { SessionMeta } from "@/types";
import {
  formatRelativeTime,
  formatSessionTitle,
  getProviderIconName,
  getProviderLabel,
  getSessionKey,
  highlightText,
} from "./utils";

interface SessionItemProps {
  session: SessionMeta;
  isSelected: boolean;
  selectionMode: boolean;
  isChecked: boolean;
  isCheckDisabled?: boolean;
  searchQuery?: string;
  onSelect: (key: string) => void;
  onToggleChecked: (checked: boolean) => void;
}

export function SessionItem({
  session,
  isSelected,
  selectionMode,
  isChecked,
  isCheckDisabled = false,
  searchQuery,
  onSelect,
  onToggleChecked,
}: SessionItemProps) {
  const { t } = useTranslation();
  const title = formatSessionTitle(session);
  const lastActive = session.lastActiveAt || session.createdAt || undefined;
  const sessionKey = getSessionKey(session);

  return (
    <div
      className={cn(
        "relative flex items-center gap-2.5 pl-3 pr-2.5 h-14 transition-colors group",
        isSelected
          ? "bg-zinc-900/[0.015] dark:bg-zinc-100/[0.02]"
          : "hover:bg-zinc-500/[0.02] dark:hover:bg-zinc-100/[0.01]",
      )}
    >
      {isSelected && (
        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-zinc-900 dark:bg-zinc-100" />
      )}
      {selectionMode && (
        <Checkbox
          checked={isChecked}
          disabled={isCheckDisabled}
          aria-label={t("sessionManager.selectForBatch", {
            defaultValue: "选择会话",
          })}
          onCheckedChange={(checked) => onToggleChecked(Boolean(checked))}
        />
      )}
      <button
        type="button"
        onClick={() => onSelect(sessionKey)}
        className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="shrink-0">
              <ProviderIcon
                icon={getProviderIconName(session.providerId)}
                name={session.providerId}
                size={16}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {getProviderLabel(session.providerId, t)}
          </TooltipContent>
        </Tooltip>
        <span className="text-sm font-medium truncate flex-1 min-w-0">
          {searchQuery ? highlightText(title, searchQuery) : title}
        </span>
        {lastActive && (
          <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
            {formatRelativeTime(lastActive, t)}
          </span>
        )}
      </button>
    </div>
  );
}
