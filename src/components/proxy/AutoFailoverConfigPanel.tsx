import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppProxyConfig, useUpdateAppProxyConfig } from "@/lib/query/proxy";
import {
  SettingSection,
  SettingsNote,
} from "@/components/settings/SettingSection";

export interface AutoFailoverConfigPanelProps {
  appType: string;
  disabled?: boolean;
}

export function AutoFailoverConfigPanel({
  appType,
  disabled = false,
}: AutoFailoverConfigPanelProps) {
  const { t } = useTranslation();
  const { data: config, isLoading, error } = useAppProxyConfig(appType);
  const updateConfig = useUpdateAppProxyConfig();

  // 使用字符串状态以支持完全清空数字输入框
  const [formData, setFormData] = useState({
    autoFailoverEnabled: false,
    maxRetries: "3",
    streamingFirstByteTimeout: "60",
    streamingIdleTimeout: "120",
    nonStreamingTimeout: "600",
    circuitFailureThreshold: "5",
    circuitSuccessThreshold: "2",
    circuitTimeoutSeconds: "60",
    circuitErrorRateThreshold: "50", // 存储百分比值
    circuitMinRequests: "10",
  });

  useEffect(() => {
    if (config) {
      setFormData({
        autoFailoverEnabled: config.autoFailoverEnabled,
        maxRetries: String(config.maxRetries),
        streamingFirstByteTimeout: String(config.streamingFirstByteTimeout),
        streamingIdleTimeout: String(config.streamingIdleTimeout),
        nonStreamingTimeout: String(config.nonStreamingTimeout),
        circuitFailureThreshold: String(config.circuitFailureThreshold),
        circuitSuccessThreshold: String(config.circuitSuccessThreshold),
        circuitTimeoutSeconds: String(config.circuitTimeoutSeconds),
        circuitErrorRateThreshold: String(
          Math.round(config.circuitErrorRateThreshold * 100),
        ),
        circuitMinRequests: String(config.circuitMinRequests),
      });
    }
  }, [config]);

  const handleSave = async () => {
    if (!config) return;
    // 解析数字，返回 NaN 表示无效输入
    const parseNum = (val: string) => {
      const trimmed = val.trim();
      // 必须是纯数字
      if (!/^-?\d+$/.test(trimmed)) return NaN;
      return parseInt(trimmed);
    };

    // 定义各字段的有效范围
    const ranges = {
      maxRetries: { min: 0, max: 10 },
      streamingFirstByteTimeout: { min: 1, max: 120 },
      streamingIdleTimeout: { min: 0, max: 600 },
      nonStreamingTimeout: { min: 60, max: 1200 },
      circuitFailureThreshold: { min: 1, max: 20 },
      circuitSuccessThreshold: { min: 1, max: 10 },
      circuitTimeoutSeconds: { min: 0, max: 300 },
      circuitErrorRateThreshold: { min: 0, max: 100 },
      circuitMinRequests: { min: 5, max: 100 },
    };

    // 解析原始值
    const raw = {
      maxRetries: parseNum(formData.maxRetries),
      streamingFirstByteTimeout: parseNum(formData.streamingFirstByteTimeout),
      streamingIdleTimeout: parseNum(formData.streamingIdleTimeout),
      nonStreamingTimeout: parseNum(formData.nonStreamingTimeout),
      circuitFailureThreshold: parseNum(formData.circuitFailureThreshold),
      circuitSuccessThreshold: parseNum(formData.circuitSuccessThreshold),
      circuitTimeoutSeconds: parseNum(formData.circuitTimeoutSeconds),
      circuitErrorRateThreshold: parseNum(formData.circuitErrorRateThreshold),
      circuitMinRequests: parseNum(formData.circuitMinRequests),
    };

    // 校验是否超出范围（NaN 也视为无效）
    const errors: string[] = [];
    const checkRange = (
      value: number,
      range: { min: number; max: number },
      label: string,
    ) => {
      if (isNaN(value) || value < range.min || value > range.max) {
        errors.push(`${label}: ${range.min}-${range.max}`);
      }
    };

    checkRange(
      raw.maxRetries,
      ranges.maxRetries,
      t("proxy.autoFailover.maxRetries", "最大重试次数"),
    );
    checkRange(
      raw.streamingFirstByteTimeout,
      ranges.streamingFirstByteTimeout,
      t("proxy.autoFailover.streamingFirstByte", "流式首字节超时"),
    );
    checkRange(
      raw.streamingIdleTimeout,
      ranges.streamingIdleTimeout,
      t("proxy.autoFailover.streamingIdle", "流式静默超时"),
    );
    checkRange(
      raw.nonStreamingTimeout,
      ranges.nonStreamingTimeout,
      t("proxy.autoFailover.nonStreaming", "非流式超时"),
    );
    checkRange(
      raw.circuitFailureThreshold,
      ranges.circuitFailureThreshold,
      t("proxy.autoFailover.failureThreshold", "失败阈值"),
    );
    checkRange(
      raw.circuitSuccessThreshold,
      ranges.circuitSuccessThreshold,
      t("proxy.autoFailover.successThreshold", "恢复成功阈值"),
    );
    checkRange(
      raw.circuitTimeoutSeconds,
      ranges.circuitTimeoutSeconds,
      t("proxy.autoFailover.timeout", "恢复等待时间"),
    );
    checkRange(
      raw.circuitErrorRateThreshold,
      ranges.circuitErrorRateThreshold,
      t("proxy.autoFailover.errorRate", "错误率阈值"),
    );
    checkRange(
      raw.circuitMinRequests,
      ranges.circuitMinRequests,
      t("proxy.autoFailover.minRequests", "最小请求数"),
    );

    if (errors.length > 0) {
      toast.error(
        t("proxy.autoFailover.validationFailed", {
          fields: errors.join("; "),
          defaultValue: `以下字段超出有效范围: ${errors.join("; ")}`,
        }),
      );
      return;
    }

    try {
      await updateConfig.mutateAsync({
        appType,
        enabled: config.enabled,
        autoFailoverEnabled: formData.autoFailoverEnabled,
        maxRetries: raw.maxRetries,
        streamingFirstByteTimeout: raw.streamingFirstByteTimeout,
        streamingIdleTimeout: raw.streamingIdleTimeout,
        nonStreamingTimeout: raw.nonStreamingTimeout,
        circuitFailureThreshold: raw.circuitFailureThreshold,
        circuitSuccessThreshold: raw.circuitSuccessThreshold,
        circuitTimeoutSeconds: raw.circuitTimeoutSeconds,
        circuitErrorRateThreshold: raw.circuitErrorRateThreshold / 100,
        circuitMinRequests: raw.circuitMinRequests,
      });
      toast.success(
        t("proxy.autoFailover.configSaved", "自动故障转移配置已保存"),
        { closeButton: true },
      );
    } catch (e) {
      toast.error(
        t("proxy.autoFailover.configSaveFailed", "保存失败") + ": " + String(e),
      );
    }
  };

  const handleReset = () => {
    if (config) {
      setFormData({
        autoFailoverEnabled: config.autoFailoverEnabled,
        maxRetries: String(config.maxRetries),
        streamingFirstByteTimeout: String(config.streamingFirstByteTimeout),
        streamingIdleTimeout: String(config.streamingIdleTimeout),
        nonStreamingTimeout: String(config.nonStreamingTimeout),
        circuitFailureThreshold: String(config.circuitFailureThreshold),
        circuitSuccessThreshold: String(config.circuitSuccessThreshold),
        circuitTimeoutSeconds: String(config.circuitTimeoutSeconds),
        circuitErrorRateThreshold: String(
          Math.round(config.circuitErrorRateThreshold * 100),
        ),
        circuitMinRequests: String(config.circuitMinRequests),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isDisabled = disabled || updateConfig.isPending;

  return (
    <div className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{String(error)}</AlertDescription>
        </Alert>
      )}

      <SettingsNote>
        {t(
          "proxy.autoFailover.info",
          "当故障转移队列中配置了多个供应商时，系统会在请求失败时按优先级顺序依次尝试。当某个供应商连续失败达到阈值时，熔断器会打开并在一段时间内跳过该供应商。",
        )}
      </SettingsNote>

      <SettingSection
        title={t("proxy.autoFailover.retrySettings", "重试与超时设置")}
        inset
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            id={`maxRetries-${appType}`}
            label={t("proxy.autoFailover.maxRetries", "最大重试次数")}
            hint={t(
              "proxy.autoFailover.maxRetriesHint",
              "请求失败时的重试次数（0-10）",
            )}
            value={formData.maxRetries}
            onChange={(value) =>
              setFormData({ ...formData, maxRetries: value })
            }
            disabled={isDisabled}
          />
          <FormField
            id={`failureThreshold-${appType}`}
            label={t("proxy.autoFailover.failureThreshold", "失败阈值")}
            hint={t(
              "proxy.autoFailover.failureThresholdHint",
              "连续失败多少次后打开熔断器（建议: 3-10）",
            )}
            value={formData.circuitFailureThreshold}
            onChange={(value) =>
              setFormData({ ...formData, circuitFailureThreshold: value })
            }
            disabled={isDisabled}
          />
        </div>
      </SettingSection>

      <SettingSection
        title={t("proxy.autoFailover.timeoutSettings", "超时配置")}
        inset
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            id={`streamingFirstByte-${appType}`}
            label={t(
              "proxy.autoFailover.streamingFirstByte",
              "流式首字节超时（秒）",
            )}
            hint={t(
              "proxy.autoFailover.streamingFirstByteHint",
              "等待首个数据块的最大时间，范围 1-120 秒，默认 60 秒",
            )}
            value={formData.streamingFirstByteTimeout}
            onChange={(value) =>
              setFormData({ ...formData, streamingFirstByteTimeout: value })
            }
            disabled={isDisabled}
          />
          <FormField
            id={`streamingIdle-${appType}`}
            label={t("proxy.autoFailover.streamingIdle", "流式静默超时（秒）")}
            hint={t(
              "proxy.autoFailover.streamingIdleHint",
              "数据块之间的最大间隔，范围 60-600 秒，填 0 禁用（防止中途卡住）",
            )}
            value={formData.streamingIdleTimeout}
            onChange={(value) =>
              setFormData({ ...formData, streamingIdleTimeout: value })
            }
            disabled={isDisabled}
          />
          <FormField
            id={`nonStreaming-${appType}`}
            label={t("proxy.autoFailover.nonStreaming", "非流式超时（秒）")}
            hint={t(
              "proxy.autoFailover.nonStreamingHint",
              "非流式请求的总超时时间，范围 60-1200 秒，默认 600 秒（10 分钟）",
            )}
            value={formData.nonStreamingTimeout}
            onChange={(value) =>
              setFormData({ ...formData, nonStreamingTimeout: value })
            }
            disabled={isDisabled}
          />
        </div>
      </SettingSection>

      <SettingSection
        title={t("proxy.autoFailover.circuitBreakerSettings", "熔断器配置")}
        inset
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <FormField
            id={`successThreshold-${appType}`}
            label={t("proxy.autoFailover.successThreshold", "恢复成功阈值")}
            hint={t(
              "proxy.autoFailover.successThresholdHint",
              "半开状态下成功多少次后关闭熔断器",
            )}
            value={formData.circuitSuccessThreshold}
            onChange={(value) =>
              setFormData({ ...formData, circuitSuccessThreshold: value })
            }
            disabled={isDisabled}
          />
          <FormField
            id={`timeoutSeconds-${appType}`}
            label={t("proxy.autoFailover.timeout", "恢复等待时间（秒）")}
            hint={t(
              "proxy.autoFailover.timeoutHint",
              "熔断器打开后，等待多久后尝试恢复（建议: 30-120）",
            )}
            value={formData.circuitTimeoutSeconds}
            onChange={(value) =>
              setFormData({ ...formData, circuitTimeoutSeconds: value })
            }
            disabled={isDisabled}
          />
          <FormField
            id={`errorRateThreshold-${appType}`}
            label={t("proxy.autoFailover.errorRate", "错误率阈值 (%)")}
            hint={t(
              "proxy.autoFailover.errorRateHint",
              "错误率超过此值时打开熔断器",
            )}
            value={formData.circuitErrorRateThreshold}
            onChange={(value) =>
              setFormData({ ...formData, circuitErrorRateThreshold: value })
            }
            disabled={isDisabled}
          />
          <FormField
            id={`minRequests-${appType}`}
            label={t("proxy.autoFailover.minRequests", "最小请求数")}
            hint={t(
              "proxy.autoFailover.minRequestsHint",
              "计算错误率前的最小请求数",
            )}
            value={formData.circuitMinRequests}
            onChange={(value) =>
              setFormData({ ...formData, circuitMinRequests: value })
            }
            disabled={isDisabled}
          />
        </div>
      </SettingSection>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={handleReset}
          disabled={isDisabled}
        >
          {t("common.reset", "重置")}
        </Button>
        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={() => void handleSave()}
          disabled={isDisabled}
        >
          {updateConfig.isPending ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              {t("common.saving", "保存中...")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-3.5 w-3.5" />
              {t("common.save", "保存")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function FormField({
  id,
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12px]">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-8 text-xs"
      />
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}
