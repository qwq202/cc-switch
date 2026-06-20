import { useState, useEffect } from "react";
import { Activity, Clock, TrendingUp, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/toggle-row";
import {
  SettingSection,
  SettingsNote,
} from "@/components/settings/SettingSection";
import { useProxyStatus } from "@/hooks/useProxyStatus";
import { toast } from "sonner";
import { useFailoverQueue } from "@/lib/query/failover";
import { ProviderHealthBadge } from "@/components/providers/ProviderHealthBadge";
import { useProviderHealth } from "@/lib/query/failover";
import {
  useProxyTakeoverStatus,
  useSetProxyTakeoverForApp,
  useGlobalProxyConfig,
  useUpdateGlobalProxyConfig,
} from "@/lib/query/proxy";
import type { ProxyStatus } from "@/types/proxy";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { extractErrorMessage } from "@/utils/errorUtils";

interface ProxyPanelProps {
  enableLocalProxy: boolean;
  onEnableLocalProxyChange: (checked: boolean) => void;
  onToggleProxy: (checked: boolean) => Promise<void>;
  isProxyPending: boolean;
}

export function ProxyPanel({
  enableLocalProxy,
  onEnableLocalProxyChange,
  onToggleProxy,
  isProxyPending,
}: ProxyPanelProps) {
  const { t } = useTranslation();
  const { status, isRunning } = useProxyStatus();

  // 获取应用接管状态
  const { data: takeoverStatus } = useProxyTakeoverStatus();
  const setTakeoverForApp = useSetProxyTakeoverForApp();

  // 获取全局代理配置
  const { data: globalConfig } = useGlobalProxyConfig();
  const updateGlobalConfig = useUpdateGlobalProxyConfig();

  // 监听地址/端口的本地状态（端口用字符串以支持完全清空）
  const [listenAddress, setListenAddress] = useState("127.0.0.1");
  const [listenPort, setListenPort] = useState("15721");

  // 同步全局配置到本地状态
  useEffect(() => {
    if (globalConfig) {
      setListenAddress(globalConfig.listenAddress);
      setListenPort(String(globalConfig.listenPort));
    }
  }, [globalConfig]);

  // 获取所有三个应用类型的故障转移队列
  // 启用自动故障转移后，将按队列优先级（P1→P2→...）选择供应商
  const { data: claudeQueue = [] } = useFailoverQueue("claude");
  const { data: codexQueue = [] } = useFailoverQueue("codex");
  const { data: geminiQueue = [] } = useFailoverQueue("gemini");

  const handleTakeoverChange = async (appType: string, enabled: boolean) => {
    try {
      await setTakeoverForApp.mutateAsync({ appType, enabled });
      toast.success(
        enabled
          ? t("proxy.takeover.enabled", {
              app: appType,
              defaultValue: `${appType} 接管已启用`,
            })
          : t("proxy.takeover.disabled", {
              app: appType,
              defaultValue: `${appType} 接管已关闭`,
            }),
        { closeButton: true },
      );
    } catch (error) {
      const detail =
        extractErrorMessage(error) ||
        t("common.unknown", { defaultValue: "未知错误" });
      toast.error(
        t("proxy.takeover.failed", {
          detail,
          defaultValue: "切换接管状态失败",
        }),
      );
    }
  };

  const handleLoggingChange = async (enabled: boolean) => {
    if (!globalConfig) return;
    try {
      await updateGlobalConfig.mutateAsync({
        ...globalConfig,
        enableLogging: enabled,
      });
      toast.success(
        enabled
          ? t("proxy.logging.enabled", { defaultValue: "日志记录已启用" })
          : t("proxy.logging.disabled", { defaultValue: "日志记录已关闭" }),
        { closeButton: true },
      );
    } catch (error) {
      toast.error(
        t("proxy.logging.failed", { defaultValue: "切换日志状态失败" }),
      );
    }
  };

  const handleSaveBasicConfig = async () => {
    if (!globalConfig) return;

    // 校验地址格式（IPv4 / IPv6 字面量 / localhost）
    const addressTrimmed = listenAddress.trim();
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const isValidIpv4 = (addr: string): boolean =>
      ipv4Regex.test(addr) &&
      addr.split(".").every((n) => {
        const num = parseInt(n, 10);
        return num >= 0 && num <= 255;
      });
    // IPv6 字面量校验：必须含 `:` 且能在 [..] 包装后被 URL 解析器接受。
    // 后端 (services/proxy.rs) 会把 `::` 改写成 `::1`，所以这里也接受 `::`。
    const isValidIpv6 = (addr: string): boolean => {
      if (!addr.includes(":")) return false;
      try {
        new URL(`http://[${addr}]/`);
        return true;
      } catch {
        return false;
      }
    };
    const normalizedAddress =
      addressTrimmed === "localhost" ? "127.0.0.1" : addressTrimmed;
    const isValidAddress =
      addressTrimmed === "localhost" ||
      addressTrimmed === "0.0.0.0" ||
      isValidIpv4(addressTrimmed) ||
      isValidIpv6(addressTrimmed);
    if (!isValidAddress) {
      toast.error(
        t("proxy.settings.invalidAddress", {
          defaultValue:
            "地址无效，请输入 IPv4（如 127.0.0.1）、IPv6（如 ::1）或 localhost",
        }),
      );
      return;
    }

    // 严格校验端口：必须是纯数字
    const portTrimmed = listenPort.trim();
    if (!/^\d+$/.test(portTrimmed)) {
      toast.error(
        t("proxy.settings.invalidPort", {
          defaultValue: "端口无效，请输入 1024-65535 之间的数字",
        }),
      );
      return;
    }
    const port = parseInt(portTrimmed);
    if (isNaN(port) || port < 1024 || port > 65535) {
      toast.error(
        t("proxy.settings.invalidPort", {
          defaultValue: "端口无效，请输入 1024-65535 之间的数字",
        }),
      );
      return;
    }
    try {
      await updateGlobalConfig.mutateAsync({
        ...globalConfig,
        listenAddress: normalizedAddress,
        listenPort: port,
      });
      toast.success(
        t("proxy.settings.configSaved", { defaultValue: "代理配置已保存" }),
        { closeButton: true },
      );
    } catch (error) {
      toast.error(
        t("proxy.settings.configSaveFailed", { defaultValue: "保存配置失败" }),
      );
    }
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // 格式化地址用于 URL（IPv6 需要方括号）
  const formatAddressForUrl = (address: string, port: number): string => {
    const isIPv6 = address.includes(":");
    const host = isIPv6 ? `[${address}]` : address;
    return `http://${host}:${port}`;
  };

  return (
    <div className="space-y-5">
      <SettingSection>
        <ToggleRow
          variant="plain"
          title={t("settings.advanced.proxy.enableFeature")}
          description={t("settings.advanced.proxy.enableFeatureDescription")}
          checked={enableLocalProxy}
          onCheckedChange={onEnableLocalProxyChange}
        />
        <ToggleRow
          variant="plain"
          title={t("proxyConfig.proxyEnabled", {
            defaultValue: "代理服务",
          })}
          description={
            isRunning
              ? t("settings.advanced.proxy.running")
              : t("settings.advanced.proxy.stopped")
          }
          checked={isRunning}
          onCheckedChange={onToggleProxy}
          disabled={isProxyPending}
        />
      </SettingSection>

      <AnimatePresence initial={false}>
        {isRunning && (
          <motion.div
            key="app-takeover"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <SettingSection
              title={t("proxyConfig.appTakeover", {
                defaultValue: "应用接管",
              })}
              footer={t("proxy.takeover.hint", {
                defaultValue:
                  "选择要接管的应用，启用后该应用的请求将通过本地路由转发",
              })}
            >
              {(["claude", "codex", "gemini"] as const).map((appType) => {
                const isEnabled =
                  takeoverStatus?.[appType as keyof typeof takeoverStatus] ??
                  false;
                return (
                  <div
                    key={appType}
                    className="flex items-center justify-between gap-4 px-4 py-2.5"
                  >
                    <span className="text-[13px] font-medium capitalize text-foreground">
                      {appType}
                    </span>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) =>
                        void handleTakeoverChange(appType, checked)
                      }
                      disabled={setTakeoverForApp.isPending}
                    />
                  </div>
                );
              })}
            </SettingSection>
          </motion.div>
        )}
      </AnimatePresence>

      {isRunning && status ? (
        <div className="space-y-5">
          <SettingSection
            title={t("proxy.panel.serviceAddress", {
              defaultValue: "服务地址",
            })}
            inset
          >
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="flex-1 rounded-md border border-border/70 bg-muted/30 px-3 py-2 font-mono text-[12px]">
                  {formatAddressForUrl(status.address, status.port)}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      formatAddressForUrl(status.address, status.port),
                    );
                    toast.success(
                      t("proxy.panel.addressCopied", {
                        defaultValue: "地址已复制",
                      }),
                      { closeButton: true },
                    );
                  }}
                >
                  {t("common.copy")}
                </Button>
              </div>
              <SettingsNote>
                {t("proxy.settings.restartRequired", {
                  defaultValue: "修改监听地址/端口需要先停止代理服务",
                })}
              </SettingsNote>

              <div className="space-y-2 border-t border-border/60 pt-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t("provider.inUse")}
                </p>
                {status.active_targets && status.active_targets.length > 0 ? (
                  <div className="divide-y divide-border/60 overflow-hidden rounded-md border border-border/70">
                    {status.active_targets.map((target) => (
                      <div
                        key={target.app_type}
                        className="flex items-center justify-between px-3 py-2 text-[12px]"
                      >
                        <span className="text-muted-foreground">
                          {target.app_type}
                        </span>
                        <span
                          className="ml-2 max-w-[180px] truncate font-medium text-foreground"
                          title={target.provider_name}
                        >
                          {target.provider_name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : status.current_provider ? (
                  <p className="text-[12px] text-muted-foreground">
                    {t("proxy.panel.currentProvider", {
                      defaultValue: "当前 Provider：",
                    })}{" "}
                    <span className="font-medium text-foreground">
                      {status.current_provider}
                    </span>
                  </p>
                ) : (
                  <SettingsNote variant="warning">
                    {t("proxy.panel.waitingFirstRequest", {
                      defaultValue: "当前 Provider：等待首次请求…",
                    })}
                  </SettingsNote>
                )}
              </div>
            </div>
          </SettingSection>

          <SettingSection>
            <ToggleRow
              variant="plain"
              title={t("proxy.settings.fields.enableLogging.label", {
                defaultValue: "启用日志记录",
              })}
              description={t(
                "proxy.settings.fields.enableLogging.description",
                {
                  defaultValue: "记录所有代理请求，便于排查问题",
                },
              )}
              checked={globalConfig?.enableLogging ?? true}
              onCheckedChange={(checked) => void handleLoggingChange(checked)}
              disabled={updateGlobalConfig.isPending}
            />
          </SettingSection>

          {(claudeQueue.length > 0 ||
            codexQueue.length > 0 ||
            geminiQueue.length > 0) && (
            <SettingSection title={t("proxy.failoverQueue.title")} inset>
              <div className="space-y-4">
                {claudeQueue.length > 0 && (
                  <ProviderQueueGroup
                    appType="claude"
                    appLabel="Claude"
                    targets={claudeQueue.map((item) => ({
                      id: item.providerId,
                      name: item.providerName,
                    }))}
                    status={status}
                  />
                )}
                {codexQueue.length > 0 && (
                  <ProviderQueueGroup
                    appType="codex"
                    appLabel="Codex"
                    targets={codexQueue.map((item) => ({
                      id: item.providerId,
                      name: item.providerName,
                    }))}
                    status={status}
                  />
                )}
                {geminiQueue.length > 0 && (
                  <ProviderQueueGroup
                    appType="gemini"
                    appLabel="Gemini"
                    targets={geminiQueue.map((item) => ({
                      id: item.providerId,
                      name: item.providerName,
                    }))}
                    status={status}
                  />
                )}
              </div>
            </SettingSection>
          )}

          <SettingSection
            title={t("proxy.panel.stats.title", { defaultValue: "运行统计" })}
            inset
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<Activity className="h-3.5 w-3.5" />}
                label={t("proxy.panel.stats.activeConnections", {
                  defaultValue: "活跃连接",
                })}
                value={status.active_connections}
              />
              <StatCard
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                label={t("proxy.panel.stats.totalRequests", {
                  defaultValue: "总请求数",
                })}
                value={status.total_requests}
              />
              <StatCard
                icon={<Clock className="h-3.5 w-3.5" />}
                label={t("proxy.panel.stats.successRate", {
                  defaultValue: "成功率",
                })}
                value={`${status.success_rate.toFixed(1)}%`}
                variant={status.success_rate > 90 ? "success" : "warning"}
              />
              <StatCard
                icon={<Clock className="h-3.5 w-3.5" />}
                label={t("proxy.panel.stats.uptime", {
                  defaultValue: "运行时间",
                })}
                value={formatUptime(status.uptime_seconds)}
              />
            </div>
          </SettingSection>
        </div>
      ) : (
        <div className="space-y-5">
          <SettingSection
            title={t("proxy.settings.basic.title", {
              defaultValue: "基础设置",
            })}
            footer={t("proxy.settings.basic.description", {
              defaultValue: "配置代理服务监听的地址与端口。",
            })}
            inset
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="listen-address" className="text-[12px]">
                  {t("proxy.settings.fields.listenAddress.label", {
                    defaultValue: "监听地址",
                  })}
                </Label>
                <Input
                  id="listen-address"
                  value={listenAddress}
                  onChange={(e) => setListenAddress(e.target.value)}
                  className="h-8 text-xs"
                  placeholder={t(
                    "proxy.settings.fields.listenAddress.placeholder",
                    { defaultValue: "127.0.0.1" },
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="listen-port" className="text-[12px]">
                  {t("proxy.settings.fields.listenPort.label", {
                    defaultValue: "监听端口",
                  })}
                </Label>
                <Input
                  id="listen-port"
                  type="number"
                  value={listenPort}
                  onChange={(e) => setListenPort(e.target.value)}
                  className="h-8 text-xs"
                  placeholder={t(
                    "proxy.settings.fields.listenPort.placeholder",
                    { defaultValue: "15721" },
                  )}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => void handleSaveBasicConfig()}
                disabled={updateGlobalConfig.isPending}
              >
                {updateGlobalConfig.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    {t("common.saving", { defaultValue: "保存中..." })}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-3.5 w-3.5" />
                    {t("common.save", { defaultValue: "保存" })}
                  </>
                )}
              </Button>
            </div>
          </SettingSection>

          <SettingsNote>
            {t("proxy.panel.stoppedDescription", {
              defaultValue: "使用上方开关即可启动服务",
            })}
          </SettingsNote>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  variant?: "default" | "success" | "warning";
}

function StatCard({ icon, label, value, variant = "default" }: StatCardProps) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <p
        className={`text-lg font-semibold tabular-nums ${
          variant === "success"
            ? "text-emerald-600 dark:text-emerald-400"
            : variant === "warning"
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

interface ProviderQueueGroupProps {
  appType: string;
  appLabel: string;
  targets: Array<{
    id: string;
    name: string;
  }>;
  status: ProxyStatus;
}

function ProviderQueueGroup({
  appType,
  appLabel,
  targets,
  status,
}: ProviderQueueGroupProps) {
  // 查找该应用类型的当前活跃目标
  const activeTarget = status.active_targets?.find(
    (t) => t.app_type === appType,
  );

  return (
    <div className="space-y-2">
      {/* 应用类型标题 */}
      <div className="flex items-center gap-2 px-2">
        <span className="text-xs font-semibold text-foreground/80">
          {appLabel}
        </span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      <div className="divide-y divide-border/60 overflow-hidden rounded-md border border-border/70">
        {targets.map((target, index) => (
          <ProviderQueueItem
            key={target.id}
            provider={target}
            priority={index + 1}
            appType={appType}
            isCurrent={activeTarget?.provider_id === target.id}
          />
        ))}
      </div>
    </div>
  );
}

interface ProviderQueueItemProps {
  provider: {
    id: string;
    name: string;
  };
  priority: number;
  appType: string;
  isCurrent: boolean;
}

function ProviderQueueItem({
  provider,
  priority,
  appType,
  isCurrent,
}: ProviderQueueItemProps) {
  const { t } = useTranslation();
  const { data: health } = useProviderHealth(provider.id, appType);

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 text-[12px] ${
        isCurrent ? "bg-primary/5" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
            isCurrent
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {priority}
        </span>
        <span className={isCurrent ? "" : "text-foreground"}>
          {provider.name}
        </span>
        {isCurrent && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
            {t("provider.inUse")}
          </span>
        )}
      </div>
      {/* 健康徽章 */}
      <ProviderHealthBadge
        consecutiveFailures={health?.consecutive_failures ?? 0}
        isHealthy={health?.is_healthy}
      />
    </div>
  );
}
