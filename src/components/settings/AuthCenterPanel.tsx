import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { CopilotAuthSection } from "@/components/providers/forms/CopilotAuthSection";
import { CodexOAuthSection } from "@/components/providers/forms/CodexOAuthSection";
import { SettingSection } from "@/components/settings/SettingSection";

export function AuthCenterPanel() {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <SettingSection
        inset
        footer={t("settings.authCenter.description", {
          defaultValue: "在 Claude Code 中使用您的其他订阅，请注意合规风险。",
        })}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[13px] font-medium text-foreground">
            {t("settings.authCenter.title", {
              defaultValue: "OAuth 认证中心",
            })}
          </h3>
          <Badge variant="secondary" className="text-[10px]">
            {t("settings.authCenter.beta", { defaultValue: "Beta" })}
          </Badge>
        </div>
      </SettingSection>

      <SettingSection
        title="GitHub Copilot"
        footer={t("settings.authCenter.copilotDescription", {
          defaultValue: "管理 GitHub Copilot 账号",
        })}
        inset
      >
        <CopilotAuthSection />
      </SettingSection>

      <SettingSection
        title="ChatGPT (Codex OAuth)"
        footer={t("settings.authCenter.codexOauthDescription", {
          defaultValue: "管理 ChatGPT 账号",
        })}
        inset
      >
        <CodexOAuthSection />
      </SettingSection>
    </div>
  );
}
