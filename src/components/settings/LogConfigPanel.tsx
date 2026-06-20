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
import { settingsApi, type LogConfig } from "@/lib/api/settings";

const LOG_LEVELS = ["error", "warn", "info", "debug", "trace"] as const;

export function LogConfigPanel() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<LogConfig>({
    enabled: true,
    level: "info",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    settingsApi
      .getLogConfig()
      .then(setConfig)
      .catch((e) => console.error("Failed to load log config:", e))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = async (updates: Partial<LogConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    try {
      await settingsApi.setLogConfig(newConfig);
    } catch (e) {
      console.error("Failed to save log config:", e);
      toast.error(String(e));
      setConfig(config);
    }
  };

  if (isLoading) return null;

  return (
    <SettingSection footer={t("settings.advanced.logConfig.levelHint")}>
      <ToggleRow
        variant="plain"
        title={t("settings.advanced.logConfig.enabled")}
        description={t("settings.advanced.logConfig.enabledDescription")}
        checked={config.enabled}
        onCheckedChange={(checked) => handleChange({ enabled: checked })}
      />
      <SettingRow
        title={t("settings.advanced.logConfig.level")}
        description={t("settings.advanced.logConfig.levelDescription")}
      >
        <Select
          value={config.level}
          disabled={!config.enabled}
          onValueChange={(value) =>
            handleChange({ level: value as LogConfig["level"] })
          }
        >
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOG_LEVELS.map((level) => (
              <SelectItem key={level} value={level} className="text-xs">
                {t(`settings.advanced.logConfig.levels.${level}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </SettingSection>
  );
}
