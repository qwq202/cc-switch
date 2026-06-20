import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { ProxyPanel } from "@/components/proxy";
import { AutoFailoverConfigPanel } from "@/components/proxy/AutoFailoverConfigPanel";
import { FailoverQueueManager } from "@/components/proxy/FailoverQueueManager";
import { RectifierConfigPanel } from "@/components/settings/RectifierConfigPanel";
import { GlobalProxySettings } from "@/components/settings/GlobalProxySettings";
import {
  SettingsDisclosure,
  SettingsDisclosureGroup,
} from "@/components/settings/SettingsDisclosure";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import { ToggleRow } from "@/components/ui/toggle-row";
import { SettingsNote } from "@/components/settings/SettingSection";
import { useProxyStatus } from "@/hooks/useProxyStatus";
import type { SettingsFormState } from "@/hooks/useSettings";

interface ProxyTabContentProps {
  settings: SettingsFormState;
  onAutoSave: (updates: Partial<SettingsFormState>) => Promise<boolean | void>;
}

export function ProxyTabContent({
  settings,
  onAutoSave,
}: ProxyTabContentProps) {
  const { t } = useTranslation();
  const [showProxyConfirm, setShowProxyConfirm] = useState(false);
  const [showFailoverConfirm, setShowFailoverConfirm] = useState(false);

  const {
    isRunning,
    takeoverStatus,
    startProxyServer,
    stopWithRestore,
    isPending: isProxyPending,
  } = useProxyStatus();

  const handleToggleProxy = async (checked: boolean) => {
    try {
      if (!checked) {
        await stopWithRestore();
      } else if (!settings?.proxyConfirmed) {
        setShowProxyConfirm(true);
      } else {
        await startProxyServer();
      }
    } catch (error) {
      console.error("Toggle proxy failed:", error);
    }
  };

  const handleProxyConfirm = async () => {
    setShowProxyConfirm(false);
    try {
      await onAutoSave({ proxyConfirmed: true });
      await startProxyServer();
    } catch (error) {
      console.error("Proxy confirm failed:", error);
    }
  };

  const handleFailoverToggleChange = (checked: boolean) => {
    if (checked && !settings?.failoverConfirmed) {
      setShowFailoverConfirm(true);
    } else {
      void onAutoSave({ enableFailoverToggle: checked });
    }
  };

  const handleFailoverConfirm = async () => {
    setShowFailoverConfirm(false);
    try {
      await onAutoSave({ failoverConfirmed: true, enableFailoverToggle: true });
    } catch (error) {
      console.error("Failover confirm failed:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <SettingsDisclosureGroup>
        <SettingsDisclosure
          value="proxy"
          title={t("settings.advanced.proxy.title")}
          description={t("settings.advanced.proxy.description")}
          trailing={
            <Badge
              variant={isRunning ? "default" : "secondary"}
              className="h-6 gap-1.5"
            >
              <Activity
                className={`h-3 w-3 ${isRunning ? "animate-pulse" : ""}`}
              />
              {isRunning
                ? t("settings.advanced.proxy.running")
                : t("settings.advanced.proxy.stopped")}
            </Badge>
          }
        >
          <ProxyPanel
            enableLocalProxy={settings?.enableLocalProxy ?? false}
            onEnableLocalProxyChange={(checked) =>
              onAutoSave({ enableLocalProxy: checked })
            }
            onToggleProxy={handleToggleProxy}
            isProxyPending={isProxyPending}
          />
        </SettingsDisclosure>

        <SettingsDisclosure
          value="failover"
          title={t("settings.advanced.failover.title")}
          description={t("settings.advanced.failover.description")}
        >
          <div className="space-y-5">
            <ToggleRow
              variant="plain"
              title={t("settings.advanced.proxy.enableFailoverToggle")}
              description={t(
                "settings.advanced.proxy.enableFailoverToggleDescription",
              )}
              checked={settings?.enableFailoverToggle ?? false}
              onCheckedChange={handleFailoverToggleChange}
            />

            {!isRunning && (
              <SettingsNote variant="warning">
                {t("proxy.failover.proxyRequired", {
                  defaultValue: "需要先启动路由服务才能配置故障转移",
                })}
              </SettingsNote>
            )}

            <Tabs defaultValue="claude" className="w-full">
              <TabsList className="inline-flex h-auto w-auto gap-0.5 rounded-md bg-muted/70 p-0.5">
                {(["claude", "codex", "gemini"] as const).map((appType) => (
                  <TabsTrigger
                    key={appType}
                    value={appType}
                    className={cn(
                      "h-7 rounded-[6px] px-3 text-[12px] font-medium capitalize shadow-none",
                      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                      "data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground",
                    )}
                  >
                    {appType}
                  </TabsTrigger>
                ))}
              </TabsList>
              {(["claude", "codex", "gemini"] as const).map((appType) => {
                const failoverDisabled =
                  !isRunning || !(takeoverStatus?.[appType] ?? false);
                return (
                  <TabsContent
                    key={appType}
                    value={appType}
                    className="mt-4 space-y-5"
                  >
                    <FailoverQueueManager
                      appType={appType}
                      disabled={failoverDisabled}
                    />
                    <AutoFailoverConfigPanel
                      appType={appType}
                      disabled={failoverDisabled}
                    />
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </SettingsDisclosure>

        <SettingsDisclosure
          value="rectifier"
          title={t("settings.advanced.rectifier.title")}
          description={t("settings.advanced.rectifier.description")}
        >
          <RectifierConfigPanel />
        </SettingsDisclosure>

        <SettingsDisclosure
          value="globalProxy"
          title={t("settings.advanced.globalProxy.title")}
          description={t("settings.advanced.globalProxy.description")}
        >
          <GlobalProxySettings />
        </SettingsDisclosure>
      </SettingsDisclosureGroup>

      <ConfirmDialog
        isOpen={showProxyConfirm}
        variant="info"
        title={t("confirm.proxy.title")}
        message={t("confirm.proxy.message")}
        confirmText={t("confirm.proxy.confirm")}
        onConfirm={() => void handleProxyConfirm()}
        onCancel={() => setShowProxyConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showFailoverConfirm}
        variant="info"
        title={t("confirm.failover.title")}
        message={t("confirm.failover.message")}
        confirmText={t("confirm.failover.confirm")}
        onConfirm={() => void handleFailoverConfirm()}
        onCancel={() => setShowFailoverConfirm(false)}
      />
    </motion.div>
  );
}
