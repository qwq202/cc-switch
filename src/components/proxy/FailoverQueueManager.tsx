import { useTranslation } from "react-i18next";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleRow } from "@/components/ui/toggle-row";
import { SettingSection } from "@/components/settings/SettingSection";
import type { FailoverQueueItem } from "@/types/proxy";
import type { AppId } from "@/lib/api";
import {
  useFailoverQueue,
  useAvailableProvidersForFailover,
  useAddToFailoverQueue,
  useRemoveFromFailoverQueue,
  useAutoFailoverEnabled,
  useSetAutoFailoverEnabled,
} from "@/lib/query/failover";
import { toast } from "sonner";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface FailoverQueueManagerProps {
  appType: AppId;
  disabled?: boolean;
}

export function FailoverQueueManager({
  appType,
  disabled = false,
}: FailoverQueueManagerProps) {
  const { t } = useTranslation();
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");

  const { data: isFailoverEnabled = false } = useAutoFailoverEnabled(appType);
  const setFailoverEnabled = useSetAutoFailoverEnabled();

  const {
    data: queue,
    isLoading: isQueueLoading,
    error: queueError,
  } = useFailoverQueue(appType);
  const { data: availableProviders, isLoading: isProvidersLoading } =
    useAvailableProvidersForFailover(appType);

  const addToQueue = useAddToFailoverQueue();
  const removeFromQueue = useRemoveFromFailoverQueue();

  const handleToggleFailover = (enabled: boolean) => {
    setFailoverEnabled.mutate({ appType, enabled });
  };

  const handleAddProvider = async () => {
    if (!selectedProviderId) return;

    try {
      await addToQueue.mutateAsync({
        appType,
        providerId: selectedProviderId,
      });
      setSelectedProviderId("");
      toast.success(
        t("proxy.failoverQueue.addSuccess", "已添加到故障转移队列"),
        { closeButton: true },
      );
    } catch (error) {
      toast.error(
        t("proxy.failoverQueue.addFailed", "添加失败") + ": " + String(error),
      );
    }
  };

  const handleRemoveProvider = async (providerId: string) => {
    try {
      await removeFromQueue.mutateAsync({ appType, providerId });
      toast.success(
        t("proxy.failoverQueue.removeSuccess", "已从故障转移队列移除"),
        { closeButton: true },
      );
    } catch (error) {
      toast.error(
        t("proxy.failoverQueue.removeFailed", "移除失败") +
          ": " +
          String(error),
      );
    }
  };

  if (isQueueLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (queueError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{String(queueError)}</AlertDescription>
      </Alert>
    );
  }

  const queueFooter = [
    t(
      "proxy.failoverQueue.info",
      "队列顺序与首页供应商列表顺序一致。当请求失败时，系统会按顺序依次尝试队列中的供应商。",
    ),
    queue && queue.length > 0
      ? t(
          "proxy.failoverQueue.orderHint",
          "队列顺序与首页供应商列表顺序一致，可在首页拖拽调整顺序。",
        )
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-4">
      <SettingSection footer={queueFooter}>
        <ToggleRow
          variant="plain"
          title={t("proxy.failover.autoSwitch", {
            defaultValue: "自动故障转移",
          })}
          description={t("proxy.failover.autoSwitchDescription", {
            defaultValue:
              "开启后将立即切换到队列 P1，并在请求失败时自动切换到队列中的下一个供应商",
          })}
          checked={isFailoverEnabled}
          onCheckedChange={handleToggleFailover}
          disabled={disabled || setFailoverEnabled.isPending}
        />

        <div className="flex items-center gap-2 px-4 py-3">
          <Select
            value={selectedProviderId}
            onValueChange={setSelectedProviderId}
            disabled={disabled || isProvidersLoading}
          >
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue
                placeholder={t(
                  "proxy.failoverQueue.selectProvider",
                  "选择供应商添加到队列",
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {availableProviders?.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                  {provider.notes && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({provider.notes})
                    </span>
                  )}
                </SelectItem>
              ))}
              {(!availableProviders || availableProviders.length === 0) && (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                  {t(
                    "proxy.failoverQueue.noAvailableProviders",
                    "没有可添加的供应商",
                  )}
                </div>
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={() => void handleAddProvider()}
            disabled={disabled || !selectedProviderId || addToQueue.isPending}
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0"
          >
            {addToQueue.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {!queue || queue.length === 0 ? (
          <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">
            {t(
              "proxy.failoverQueue.empty",
              "故障转移队列为空。添加供应商以启用自动故障转移。",
            )}
          </div>
        ) : (
          queue.map((item, index) => (
            <QueueItem
              key={item.providerId}
              item={item}
              index={index}
              disabled={disabled}
              onRemove={handleRemoveProvider}
              isRemoving={removeFromQueue.isPending}
            />
          ))
        )}
      </SettingSection>
    </div>
  );
}

interface QueueItemProps {
  item: FailoverQueueItem;
  index: number;
  disabled: boolean;
  onRemove: (providerId: string) => void;
  isRemoving: boolean;
}

function QueueItem({
  item,
  index,
  disabled,
  onRemove,
  isRemoving,
}: QueueItemProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-foreground">
          {item.providerName}
          {item.providerNotes && (
            <span className="ml-1 font-normal text-muted-foreground">
              ({item.providerNotes})
            </span>
          )}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => void onRemove(item.providerId)}
        disabled={disabled || isRemoving}
        aria-label={t("common.delete", "删除")}
      >
        {isRemoving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
