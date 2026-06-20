import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ToggleRow } from "@/components/ui/toggle-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingRow } from "@/components/settings/SettingRow";
import { SettingSection } from "@/components/settings/SettingSection";
import {
  settingsApi,
  type RectifierConfig,
  type OptimizerConfig,
} from "@/lib/api/settings";

export function RectifierConfigPanel() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<RectifierConfig>({
    enabled: true,
    requestThinkingSignature: true,
    requestThinkingBudget: true,
    requestMediaFallback: true,
    requestMediaHeuristic: true,
  });
  const [optimizerConfig, setOptimizerConfig] = useState<OptimizerConfig>({
    enabled: false,
    thinkingOptimizer: true,
    cacheInjection: true,
    cacheTtl: "1h",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    settingsApi
      .getRectifierConfig()
      .then(setConfig)
      .catch((e) => console.error("Failed to load rectifier config:", e))
      .finally(() => setIsLoading(false));
    settingsApi
      .getOptimizerConfig()
      .then(setOptimizerConfig)
      .catch((e) => console.error("Failed to load optimizer config:", e));
  }, []);

  const handleChange = async (updates: Partial<RectifierConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    try {
      await settingsApi.setRectifierConfig(newConfig);
    } catch (e) {
      console.error("Failed to save rectifier config:", e);
      toast.error(String(e));
      setConfig(config);
    }
  };

  const handleOptimizerChange = async (updates: Partial<OptimizerConfig>) => {
    const newConfig = { ...optimizerConfig, ...updates };
    setOptimizerConfig(newConfig);
    try {
      await settingsApi.setOptimizerConfig(newConfig);
    } catch (e) {
      console.error("Failed to save optimizer config:", e);
      toast.error(String(e));
      setOptimizerConfig(optimizerConfig);
    }
  };

  if (isLoading) return null;

  return (
    <div className="space-y-5">
      <SettingSection
        title={t("settings.advanced.rectifier.title")}
        footer={t("settings.advanced.rectifier.enabledDescription")}
      >
        <ToggleRow
          variant="plain"
          title={t("settings.advanced.rectifier.enabled")}
          checked={config.enabled}
          onCheckedChange={(checked) => handleChange({ enabled: checked })}
        />
        <ToggleRow
          variant="plain"
          title={t("settings.advanced.rectifier.thinkingSignature")}
          description={t(
            "settings.advanced.rectifier.thinkingSignatureDescription",
          )}
          checked={config.requestThinkingSignature}
          disabled={!config.enabled}
          onCheckedChange={(checked) =>
            handleChange({ requestThinkingSignature: checked })
          }
        />
        <ToggleRow
          variant="plain"
          title={t("settings.advanced.rectifier.thinkingBudget")}
          description={t(
            "settings.advanced.rectifier.thinkingBudgetDescription",
          )}
          checked={config.requestThinkingBudget}
          disabled={!config.enabled}
          onCheckedChange={(checked) =>
            handleChange({ requestThinkingBudget: checked })
          }
        />
        <ToggleRow
          variant="plain"
          title={t("settings.advanced.rectifier.mediaFallback")}
          description={t(
            "settings.advanced.rectifier.mediaFallbackDescription",
          )}
          checked={config.requestMediaFallback}
          disabled={!config.enabled}
          onCheckedChange={(checked) =>
            handleChange({ requestMediaFallback: checked })
          }
        />
        <ToggleRow
          variant="plain"
          title={t("settings.advanced.rectifier.mediaHeuristic")}
          description={t(
            "settings.advanced.rectifier.mediaHeuristicDescription",
          )}
          checked={config.requestMediaHeuristic}
          disabled={!config.enabled || !config.requestMediaFallback}
          onCheckedChange={(checked) =>
            handleChange({ requestMediaHeuristic: checked })
          }
        />
      </SettingSection>

      <SettingSection
        title={t("settings.advanced.optimizer.title")}
        footer={t("settings.advanced.optimizer.description")}
      >
        <ToggleRow
          variant="plain"
          title={t("settings.advanced.optimizer.enabled")}
          checked={optimizerConfig.enabled}
          onCheckedChange={(checked) =>
            handleOptimizerChange({ enabled: checked })
          }
        />
        <ToggleRow
          variant="plain"
          title={t("settings.advanced.optimizer.thinkingOptimizer")}
          description={t(
            "settings.advanced.optimizer.thinkingOptimizerDescription",
          )}
          checked={optimizerConfig.thinkingOptimizer}
          disabled={!optimizerConfig.enabled}
          onCheckedChange={(checked) =>
            handleOptimizerChange({ thinkingOptimizer: checked })
          }
        />
        <ToggleRow
          variant="plain"
          title={t("settings.advanced.optimizer.cacheInjection")}
          description={t(
            "settings.advanced.optimizer.cacheInjectionDescription",
          )}
          checked={optimizerConfig.cacheInjection}
          disabled={!optimizerConfig.enabled}
          onCheckedChange={(checked) =>
            handleOptimizerChange({ cacheInjection: checked })
          }
        />
        {optimizerConfig.cacheInjection ? (
          <SettingRow title={t("settings.advanced.optimizer.cacheTtl")}>
            <Select
              value={optimizerConfig.cacheTtl}
              disabled={
                !optimizerConfig.enabled || !optimizerConfig.cacheInjection
              }
              onValueChange={(value) =>
                handleOptimizerChange({ cacheTtl: value })
              }
            >
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5m">
                  {t("settings.advanced.optimizer.cacheTtl5m")}
                </SelectItem>
                <SelectItem value="1h">
                  {t("settings.advanced.optimizer.cacheTtl1h")}
                </SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        ) : null}
      </SettingSection>
    </div>
  );
}
