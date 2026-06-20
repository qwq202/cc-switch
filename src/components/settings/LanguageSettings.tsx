import { useTranslation } from "react-i18next";
import { SettingRow } from "./SettingRow";
import { SegmentedControl } from "./SegmentedControl";

type LanguageOption = "zh" | "zh-TW" | "en" | "ja";

interface LanguageSettingsProps {
  value: LanguageOption;
  onChange: (value: LanguageOption) => void;
}

export function LanguageSettings({ value, onChange }: LanguageSettingsProps) {
  const { t } = useTranslation();

  return (
    <SettingRow
      title={t("settings.language")}
      description={t("settings.languageHint")}
    >
      <SegmentedControl
        value={value}
        onChange={onChange}
        options={[
          { value: "zh", label: t("settings.languageOptionChinese") },
          {
            value: "zh-TW",
            label: t("settings.languageOptionTraditionalChinese"),
          },
          { value: "en", label: t("settings.languageOptionEnglish") },
          { value: "ja", label: t("settings.languageOptionJapanese") },
        ]}
      />
    </SettingRow>
  );
}
