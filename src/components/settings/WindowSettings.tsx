import { useTranslation } from "react-i18next";
import type { SettingsFormState } from "@/hooks/useSettings";
import { ToggleRow } from "@/components/ui/toggle-row";
import { AnimatePresence, motion } from "framer-motion";
import { isLinux } from "@/lib/platform";

interface WindowSettingsProps {
  settings: SettingsFormState;
  onChange: (updates: Partial<SettingsFormState>) => void;
}

export function WindowSettings({ settings, onChange }: WindowSettingsProps) {
  const { t } = useTranslation();

  return (
    <>
      <ToggleRow
        variant="plain"
        title={t("settings.launchOnStartup")}
        description={t("settings.launchOnStartupDescription")}
        checked={!!settings.launchOnStartup}
        onCheckedChange={(value) => onChange({ launchOnStartup: value })}
      />

      <AnimatePresence initial={false}>
        {settings.launchOnStartup ? (
          <motion.div
            key="silent-startup"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ToggleRow
              variant="plain"
              title={t("settings.silentStartup")}
              description={t("settings.silentStartupDescription")}
              checked={!!settings.silentStartup}
              onCheckedChange={(value) => onChange({ silentStartup: value })}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ToggleRow
        variant="plain"
        title={t("settings.enableClaudePluginIntegration")}
        description={t("settings.enableClaudePluginIntegrationDescription")}
        checked={!!settings.enableClaudePluginIntegration}
        onCheckedChange={(value) =>
          onChange({ enableClaudePluginIntegration: value })
        }
      />

      <ToggleRow
        variant="plain"
        title={t("settings.skipClaudeOnboarding")}
        description={t("settings.skipClaudeOnboardingDescription")}
        checked={!!settings.skipClaudeOnboarding}
        onCheckedChange={(value) => onChange({ skipClaudeOnboarding: value })}
      />

      <ToggleRow
        variant="plain"
        title={t("settings.minimizeToTray")}
        description={t("settings.minimizeToTrayDescription")}
        checked={settings.minimizeToTrayOnClose}
        onCheckedChange={(value) => onChange({ minimizeToTrayOnClose: value })}
      />

      {isLinux() ? (
        <ToggleRow
          variant="plain"
          title={t("settings.useAppWindowControls")}
          description={t("settings.useAppWindowControlsDescription")}
          checked={!!settings.useAppWindowControls}
          onCheckedChange={(value) => onChange({ useAppWindowControls: value })}
        />
      ) : null}
    </>
  );
}
