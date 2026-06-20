/**
 * 全局出站代理设置组件
 *
 * 提供配置全局代理的输入界面，支持用户名密码认证。
 */

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, TestTube2, Search, Eye, EyeOff, X } from "lucide-react";
import {
  useGlobalProxyUrl,
  useSetGlobalProxyUrl,
  useTestProxy,
  useScanProxies,
  type DetectedProxy,
} from "@/hooks/useGlobalProxy";
import { SettingSection } from "@/components/settings/SettingSection";

/** 从完整 URL 提取认证信息 */
function extractAuth(url: string): {
  baseUrl: string;
  username: string;
  password: string;
} {
  if (!url.trim()) return { baseUrl: "", username: "", password: "" };

  try {
    const parsed = new URL(url);
    const username = decodeURIComponent(parsed.username || "");
    const password = decodeURIComponent(parsed.password || "");
    // 移除认证信息，获取基础 URL
    parsed.username = "";
    parsed.password = "";
    return { baseUrl: parsed.toString(), username, password };
  } catch {
    return { baseUrl: url, username: "", password: "" };
  }
}

/** 将认证信息合并到 URL */
function mergeAuth(
  baseUrl: string,
  username: string,
  password: string,
): string {
  if (!baseUrl.trim()) return "";
  if (!username.trim()) return baseUrl;

  try {
    const parsed = new URL(baseUrl);
    // URL 对象的 username/password setter 会自动进行 percent-encoding
    // 不要使用 encodeURIComponent，否则会导致双重编码
    parsed.username = username.trim();
    if (password) {
      parsed.password = password;
    }
    return parsed.toString();
  } catch {
    // URL 解析失败，尝试手动插入（此时需要手动编码）
    const match = baseUrl.match(/^(\w+:\/\/)(.+)$/);
    if (match) {
      const auth = password
        ? `${encodeURIComponent(username.trim())}:${encodeURIComponent(password)}@`
        : `${encodeURIComponent(username.trim())}@`;
      return `${match[1]}${auth}${match[2]}`;
    }
    return baseUrl;
  }
}

export function GlobalProxySettings() {
  const { t } = useTranslation();
  const { data: savedUrl, isLoading } = useGlobalProxyUrl();
  const setMutation = useSetGlobalProxyUrl();
  const testMutation = useTestProxy();
  const scanMutation = useScanProxies();

  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [detected, setDetected] = useState<DetectedProxy[]>([]);

  // 计算完整 URL（含认证信息）
  const fullUrl = useMemo(
    () => mergeAuth(url, username, password),
    [url, username, password],
  );

  // 同步远程配置
  useEffect(() => {
    if (savedUrl !== undefined) {
      const { baseUrl, username: u, password: p } = extractAuth(savedUrl || "");
      setUrl(baseUrl);
      setUsername(u);
      setPassword(p);
      setDirty(false);
    }
  }, [savedUrl]);

  const handleSave = async () => {
    await setMutation.mutateAsync(fullUrl);
    setDirty(false);
  };

  const handleTest = async () => {
    if (fullUrl) {
      await testMutation.mutateAsync(fullUrl);
    }
  };

  const handleScan = async () => {
    const result = await scanMutation.mutateAsync();
    setDetected(result);
  };

  const handleSelect = (proxyUrl: string) => {
    const { baseUrl, username: u, password: p } = extractAuth(proxyUrl);
    setUrl(baseUrl);
    setUsername(u);
    setPassword(p);
    setDirty(true);
    setDetected([]);
  };

  const handleClear = () => {
    setUrl("");
    setUsername("");
    setPassword("");
    setDirty(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && dirty && !setMutation.isPending) {
      handleSave();
    }
  };

  // 只在首次加载且无数据时显示加载状态
  if (isLoading && savedUrl === undefined) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SettingSection footer={t("settings.globalProxy.hint")} inset>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="http://127.0.0.1:7890 / socks5://127.0.0.1:1080"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setDirty(true);
            }}
            onKeyDown={handleKeyDown}
            className="h-8 flex-1 font-mono text-xs"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={scanMutation.isPending}
            onClick={() => void handleScan()}
            title={t("settings.globalProxy.scan")}
          >
            {scanMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!fullUrl || testMutation.isPending}
            onClick={() => void handleTest()}
            title={t("settings.globalProxy.test")}
          >
            {testMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <TestTube2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!url && !username && !password}
            onClick={handleClear}
            title={t("settings.globalProxy.clear")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={!dirty || setMutation.isPending}
            size="sm"
            className="h-8 shrink-0 text-xs"
          >
            {setMutation.isPending && (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            )}
            {t("common.save")}
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={t("settings.globalProxy.username")}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setDirty(true);
            }}
            onKeyDown={handleKeyDown}
            className="h-8 flex-1 font-mono text-xs"
          />
          <div className="relative flex-1">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder={t("settings.globalProxy.password")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setDirty(true);
              }}
              onKeyDown={handleKeyDown}
              className="h-8 pr-10 font-mono text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-8 w-8 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        {detected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {detected.map((p) => (
              <Button
                key={p.url}
                variant="secondary"
                size="sm"
                onClick={() => handleSelect(p.url)}
                className="h-7 font-mono text-[10px]"
              >
                {p.url}
              </Button>
            ))}
          </div>
        )}
      </div>
    </SettingSection>
  );
}
