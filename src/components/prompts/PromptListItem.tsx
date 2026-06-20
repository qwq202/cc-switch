import React from "react";
import { useTranslation } from "react-i18next";
import { Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Prompt } from "@/lib/api";
import PromptToggle from "./PromptToggle";

interface PromptListItemProps {
  id: string;
  prompt: Prompt;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const PromptListItem: React.FC<PromptListItemProps> = ({
  id,
  prompt,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  const enabled = prompt.enabled === true;

  return (
    <div
      className={`group relative flex items-center gap-4 px-4 py-3.5 transition-colors ${
        enabled
          ? "bg-emerald-500/[0.02]"
          : "hover:bg-zinc-500/[0.02] dark:hover:bg-zinc-100/[0.01]"
      }`}
    >
      {enabled && (
        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-emerald-500" />
      )}
      <div className="flex items-center gap-4 h-full w-full">
        {/* Toggle 开关 */}
        <div className="flex-shrink-0">
          <PromptToggle
            enabled={enabled}
            onChange={(newEnabled) => onToggle(id, newEnabled)}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-zinc-800 dark:text-zinc-200 mb-0.5">
            {prompt.name}
          </h3>
          {prompt.description && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
              {prompt.description}
            </p>
          )}
        </div>

        <div
          className={`flex items-center gap-1 flex-shrink-0 transition-opacity ${
            enabled
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          }`}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-900/5 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/5"
            onClick={() => onEdit(id)}
            title={t("common.edit")}
          >
            <Edit3 size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-500/10 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-500/15"
            onClick={() => onDelete(id)}
            title={t("common.delete")}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromptListItem;
