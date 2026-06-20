import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/theme-provider";
import { SettingRow } from "./SettingRow";
import { SegmentedControl } from "./SegmentedControl";

export function ThemeSettings() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <SettingRow
      title={t("settings.theme")}
      description={t("settings.themeHint")}
    >
      <SegmentedControl
        value={theme}
        onChange={setTheme}
        options={[
          {
            value: "light",
            label: t("settings.themeLight"),
            icon: Sun,
          },
          {
            value: "dark",
            label: t("settings.themeDark"),
            icon: Moon,
          },
          {
            value: "system",
            label: t("settings.themeSystem"),
            icon: Monitor,
          },
        ]}
      />
    </SettingRow>
  );
}
