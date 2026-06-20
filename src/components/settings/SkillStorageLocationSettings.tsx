import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { SettingRow } from "./SettingRow";
import { skillsApi, type MigrationResult } from "@/lib/api/skills";
import type { SkillStorageLocation } from "@/types";

export interface SkillStorageLocationSettingsProps {
  value: SkillStorageLocation;
  installedCount: number;
  onMigrated: (target: SkillStorageLocation) => void;
}

export function SkillStorageLocationSettings({
  value,
  installedCount,
  onMigrated,
}: SkillStorageLocationSettingsProps) {
  const { t } = useTranslation();
  const [pendingTarget, setPendingTarget] =
    useState<SkillStorageLocation | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const handleSelect = (target: SkillStorageLocation) => {
    if (target === value) return;
    if (installedCount > 0) {
      setPendingTarget(target);
    } else {
      void doMigrate(target);
    }
  };

  const doMigrate = async (target: SkillStorageLocation) => {
    setIsMigrating(true);
    setPendingTarget(null);
    try {
      const result: MigrationResult = await skillsApi.migrateStorage(target);
      if (result.errors.length > 0) {
        toast.warning(
          t("settings.skillStorage.migrationPartial", {
            migrated: result.migratedCount,
            errors: result.errors.length,
          }),
        );
      } else {
        toast.success(
          t("settings.skillStorage.migrationSuccess", {
            count: result.migratedCount,
          }),
        );
      }
      onMigrated(target);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <>
      <SettingRow title={t("settings.skillStorage.title")}>
        <div className="inline-flex flex-shrink-0 gap-0.5 rounded-md bg-muted/70 p-0.5">
          <StorageButton
            active={value === "cc_switch"}
            disabled={isMigrating}
            onClick={() => handleSelect("cc_switch")}
          >
            {t("settings.skillStorage.ccSwitch")}
          </StorageButton>
          <StorageButton
            active={value === "unified"}
            disabled={isMigrating}
            onClick={() => handleSelect("unified")}
          >
            {isMigrating && value !== "unified" ? (
              <Loader2 size={12} className="mr-1 animate-spin" />
            ) : null}
            {t("settings.skillStorage.unified")}
          </StorageButton>
        </div>
      </SettingRow>

      <Dialog
        open={pendingTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTarget(null);
        }}
      >
        <DialogContent className="max-w-md" zIndex="alert">
          <DialogHeader>
            <DialogTitle>{t("settings.skillStorage.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("settings.skillStorage.confirmMessage", {
                count: installedCount,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => pendingTarget && void doMigrate(pendingTarget)}
            >
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface StorageButtonProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function StorageButton({
  active,
  disabled,
  onClick,
  children,
}: StorageButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-7 min-w-[76px] rounded-[6px] border-none px-3 text-[12px] font-medium shadow-none transition-all",
        active
          ? "bg-background text-foreground shadow-sm hover:bg-background dark:bg-blue-600 dark:text-white dark:hover:bg-blue-600"
          : "bg-transparent text-muted-foreground hover:bg-background/40 hover:text-foreground",
      )}
    >
      {children}
    </Button>
  );
}

export function getSkillStorageFooter(
  value: SkillStorageLocation,
  t: (key: string) => string,
): string {
  const hint =
    value === "unified"
      ? t("settings.skillStorage.unifiedHint")
      : t("settings.skillStorage.ccSwitchHint");

  return `${t("settings.skillStorage.description")} ${hint}`;
}
