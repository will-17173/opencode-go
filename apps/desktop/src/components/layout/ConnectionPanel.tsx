import { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  Check,
  Wifi,
  Hash,
  Activity,
  FolderOpen,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProxyPort } from '@/hooks/useProxyPort';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Project } from '@/hooks/useProjects';

interface DebugStatus {
  opencodeRunning: boolean;
  opencodeHealthy: boolean;
}

interface NetworkInfo {
  ips: string[];
}

interface PairingCodeResponse {
  pairingCode: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      title="复制"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function StatusDot({ running, healthy }: { running: boolean; healthy: boolean }) {
  const isOnline = running && healthy;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
      )}
    >
      <span className={cn(
        'h-2 w-2 rounded-full',
        isOnline ? 'bg-primary' : 'bg-amber-500'
      )} />
      <span>{isOnline ? '在线' : '离线'}</span>
    </span>
  );
}

interface ConnectionPanelProps {
  projects: Project[];
  onAddProject: () => void;
  onRemoveProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
}

export function ConnectionPanel({
  projects,
  onAddProject,
  onRemoveProject,
  onRenameProject,
}: ConnectionPanelProps) {
  const proxyPort = useProxyPort();
  const baseUrl = proxyPort ? `http://127.0.0.1:${proxyPort}` : null;

  const [ips, setIps] = useState<string[] | null>(null);
  const [opencodeRunning, setOpencodeRunning] = useState(false);
  const [opencodeHealthy, setOpencodeHealthy] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!baseUrl) return;
    try {
      const res = await fetch(`${baseUrl}/api/debug/status`);
      if (res.ok) {
        const data = (await res.json()) as DebugStatus;
        setOpencodeRunning(data.opencodeRunning);
        setOpencodeHealthy(data.opencodeHealthy);
      }
    } catch { /* ignore */ }
  }, [baseUrl]);

  const fetchNetworkInfo = useCallback(async () => {
    if (!baseUrl) return;
    try {
      const res = await fetch(`${baseUrl}/api/network/info`);
      if (res.ok) {
        const data = (await res.json()) as NetworkInfo;
        setIps(data.ips ?? []);
      }
    } catch {
      setIps([]);
    }
  }, [baseUrl]);

  const fetchPairingCode = useCallback(async () => {
    if (!baseUrl) return;
    try {
      const res = await fetch(`${baseUrl}/api/settings/pairing-code`);
      if (res.ok) {
        const data = (await res.json()) as PairingCodeResponse;
        setPairingCode(data.pairingCode ?? '');
      }
    } catch {
      setPairingCode('');
    }
  }, [baseUrl]);

  useEffect(() => {
    if (!baseUrl) return;
    fetchNetworkInfo();
    fetchPairingCode();
    fetchStatus();
  }, [baseUrl, fetchNetworkInfo, fetchPairingCode, fetchStatus]);

  useEffect(() => {
    if (!baseUrl) return;
    const timer = setInterval(fetchStatus, 5000);
    return () => clearInterval(timer);
  }, [baseUrl, fetchStatus]);

  const startRename = (project: Project) => {
    setRenamingId(project.id);
    setRenameValue(project.name);
  };

  const commitRename = (id: string) => {
    const trimmed = renameValue.trim();
    if (trimmed) onRenameProject(id, trimmed);
    setRenamingId(null);
  };

  const primaryIp = ips?.[0] ?? '-';
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-[#f5f7f8] via-[#f7f8fa] to-[#fafbfc] p-6 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-border/60 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(13,18,30,0.04)] sm:px-5">
          <div className="grid gap-2.5 rounded-xl bg-[#fcfcfd] text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-white px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Activity className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">状态</p>
                <StatusDot running={opencodeRunning} healthy={opencodeHealthy} />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-white px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Wifi className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">IP</p>
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium text-foreground">{primaryIp}</span>
                  {ips && ips.length > 1 ? (
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      +{ips.length - 1}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-white px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Hash className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">端口</p>
                <span className="font-mono font-medium text-foreground">{proxyPort ?? '...'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-white px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Copy className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">配对码</p>
                <span className="font-mono text-xs font-semibold tracking-[0.2em] text-foreground">
                  {pairingCode ?? '------'}
                </span>
              </div>
              {pairingCode ? <CopyBtn text={pairingCode} /> : null}
            </div>
          </div>
        </section>

        {/* 工作目录紧凑列表 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-foreground">目录管理</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{projects.length} 个目录</span>
              <Button
                onClick={onAddProject}
                size="sm"
                className="h-9 rounded-lg bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                添加目录
              </Button>
            </div>
          </div>

          {projects.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-[0_10px_24px_rgba(13,18,30,0.04)]">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-border/50 bg-[#f8fafb] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <span>目录</span>
                <span>操作</span>
              </div>
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className={cn(
                    'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5',
                    index !== projects.length - 1 && 'border-b border-border/50'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      <FolderOpen className="h-4 w-4" />
                    </div>
                    {renamingId === project.id ? (
                      <input
                        className="min-w-0 rounded-md border border-border/70 bg-background px-2 py-1 text-sm outline-none ring-primary/30 focus:ring-2"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(project.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(project.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{project.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{project.path}</p>
                      </div>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                        title="目录操作"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem onClick={() => startRename(project)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        重命名
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(project)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        移除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}

          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground">还没有目录，先添加一个开始使用。</p>
          )}
        </section>
      </div>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>移除工作目录</AlertDialogTitle>
            <AlertDialogDescription>
              确认移除「{deleteTarget?.name}」？仅移除引用，不删除磁盘文件。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) onRemoveProject(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}