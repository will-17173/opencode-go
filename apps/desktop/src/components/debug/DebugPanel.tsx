import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Trash2, CheckCircle2, XCircle, AlertTriangle, Info, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DebugPanelProps {
  proxyPort: number | null;
  onClose: () => void;
}

interface DebugStatus {
  opencodeRunning: boolean;
  opencodePid: number | null;
  proxyPort: number;
  opencodePort: number;
  opencodeHealthy: boolean;
  hasApiKey: boolean;
  providers: Record<string, { providerType: string; model: string; baseURL: string; apiKeyMasked?: string }>;
  baseURL: string;
  appVersion: string;
  logFilePath: string;
  uptimeSeconds: number;
  platform: string;
  arch: string;
  errorCount: number;
  warnCount: number;
}

interface LogEntry {
  id: number;
  time: string;
  level: 'log' | 'warn' | 'error';
  message: string;
}

export function DebugPanel({ proxyPort, onClose }: DebugPanelProps) {
  const [status, setStatus] = useState<DebugStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastLogId, setLastLogId] = useState(0);

  const fetchStatus = useCallback(async () => {
    if (!proxyPort) return;
    try {
      const res = await fetch(`http://127.0.0.1:${proxyPort}/api/debug/status`);
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (e) {
      console.error('[debug] failed to fetch status', e);
    }
  }, [proxyPort]);

  const fetchLogs = useCallback(async (since = 0) => {
    if (!proxyPort) return;
    try {
      const url = since > 0
        ? `http://127.0.0.1:${proxyPort}/api/debug/logs?since=${since}`
        : `http://127.0.0.1:${proxyPort}/api/debug/logs`;
      const res = await fetch(url);
      if (res.ok) {
        const entries: LogEntry[] = await res.json();
        if (since > 0 && entries.length > 0) {
          setLogs((prev) => [...prev, ...entries].slice(-500));
        } else {
          setLogs(entries);
        }
        if (entries.length > 0) {
          setLastLogId(entries[entries.length - 1].id);
        }
      }
    } catch (e) {
      console.error('[debug] failed to fetch logs', e);
    }
  }, [proxyPort]);

  const handleRestart = async () => {
    if (!proxyPort || loading) return;
    setLoading(true);
    try {
      await fetch(`http://127.0.0.1:${proxyPort}/api/debug/restart`, { method: 'POST' });
      await new Promise((r) => setTimeout(r, 2000));
      await fetchStatus();
    } catch (e) {
      console.error('[debug] restart failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!proxyPort) return;
    try {
      await fetch(`http://127.0.0.1:${proxyPort}/api/debug/logs`, { method: 'DELETE' });
      setLogs([]);
      setLastLogId(0);
    } catch (e) {
      console.error('[debug] clear logs failed', e);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchStatus();
    fetchLogs();
  }, [fetchStatus, fetchLogs]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh || !proxyPort) return;
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs(lastLogId);
    }, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh, proxyPort, lastLogId, fetchStatus, fetchLogs]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[90vh] w-[900px] flex-col rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Debug Panel</h2>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              自动刷新
            </label>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Status Grid */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            {/* OpenCode Status */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">OpenCode 服务</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">状态</span>
                  <span className={cn(
                    'flex items-center gap-1.5 font-medium',
                    status?.opencodeRunning && status?.opencodeHealthy ? 'text-green-500' : 'text-red-500'
                  )}>
                    {status?.opencodeRunning && status?.opencodeHealthy ? (
                      <><CheckCircle2 className="h-4 w-4" /> 运行中</>
                    ) : (
                      <><XCircle className="h-4 w-4" /> 已停止</>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">PID</span>
                  <span className="font-mono">{status?.opencodePid ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">端口</span>
                  <span className="font-mono">{status?.opencodePort ?? '-'}</span>
                </div>
              </div>
            </div>

            {/* App Status */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">应用状态</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">版本</span>
                  <span className="font-mono">{status?.appVersion ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">代理端口</span>
                  <span className="font-mono">{status?.proxyPort ?? proxyPort ?? '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">运行时间</span>
                  <span className="font-mono">{status ? formatUptime(status.uptimeSeconds) : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">平台</span>
                  <span className="font-mono">{status?.platform ?? '-'} / {status?.arch ?? '-'}</span>
                </div>
              </div>
            </div>

            {/* Provider Status */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">AI Provider</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">API Key</span>
                  <span className={cn(
                    'flex items-center gap-1.5 font-medium',
                    status?.hasApiKey ? 'text-green-500' : 'text-yellow-500'
                  )}>
                    {status?.hasApiKey ? (
                      <><CheckCircle2 className="h-4 w-4" /> 已配置</>
                    ) : (
                      <><AlertTriangle className="h-4 w-4" /> 未配置</>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Base URL</span>
                  <span className="max-w-[200px] truncate font-mono text-xs">{status?.baseURL || '-'}</span>
                </div>
              </div>
            </div>

            {/* Log Summary */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">日志统计</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">错误</span>
                  <span className={cn('font-mono', status?.errorCount ? 'text-red-500' : '')}>
                    {status?.errorCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">警告</span>
                  <span className={cn('font-mono', status?.warnCount ? 'text-yellow-500' : '')}>
                    {status?.warnCount ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">日志文件</span>
                  <span className="max-w-[200px] truncate font-mono text-xs">{status?.logFilePath ?? '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-6 flex gap-3">
            <Button variant="outline" size="sm" onClick={handleRestart} disabled={loading} className="gap-1.5">
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              重启服务
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearLogs} className="gap-1.5">
              <Trash2 className="h-4 w-4" />
              清空日志
            </Button>
            <Button variant="outline" size="sm" onClick={() => { fetchStatus(); fetchLogs(); }} className="gap-1.5">
              <RefreshCw className="h-4 w-4" />
              刷新
            </Button>
          </div>

          {/* Logs */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-2">
              <h3 className="text-sm font-medium text-muted-foreground">运行日志（最近 500 条）</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground">暂无日志</div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      'flex gap-3 border-b border-border/50 px-4 py-1.5',
                      log.level === 'error' && 'bg-red-500/5',
                      log.level === 'warn' && 'bg-yellow-500/5'
                    )}
                  >
                    <span className="shrink-0 text-muted-foreground">{log.time}</span>
                    <span className={cn(
                      'shrink-0 w-12',
                      log.level === 'error' && 'text-red-500',
                      log.level === 'warn' && 'text-yellow-500',
                      log.level === 'log' && 'text-green-500'
                    )}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="min-w-0 flex-1 whitespace-pre-wrap break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}