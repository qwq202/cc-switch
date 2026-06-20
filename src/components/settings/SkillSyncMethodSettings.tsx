import { useTranslation } from "react-i18next";
import { SettingRow } from "./SettingRow";
import { SegmentedControl } from "./SegmentedControl";
import type { SkillSyncMethod } from "@/types";

export interface SkillSyncMethodSettingsProps {
  value: SkillSyncMethod;
  onChange: (value: SkillSyncMethod) => void;
}

export function SkillSyncMethodSettings({
  value,
  onChange,
}: SkillSyncMethodSettingsProps) {
  const { t } = useTranslation();
  const displayValue = value === "copy" ? "copy" : "symlink";

  return (
    <SettingRow title={t("settings.skillSync.title")}>
      <SegmentedControl
        value={displayValue}
        onChange={onChange}
        options={[
          { value: "symlink", label: t("settings.skillSync.symlink") },
          { value: "copy", label: t("settings.skillSync.copy") },
        ]}
      />
    </SettingRow>
  );
}

export function getSkillSyncFooter(
  value: SkillSyncMethod,
  t: (key: string) => string,
): string {
  const displayValue = value === "copy" ? "copy" : "symlink";
  if (displayValue === "symlink") {
    return `${t("settings.skillSync.description")} ${t("settings.skillSync.symlinkHint")}`;
  }
  return t("settings.skillSync.description");
}
