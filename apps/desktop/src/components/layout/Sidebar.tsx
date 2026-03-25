import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  Settings,
  ChevronRight,
  ChevronLeft,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Sparkles,
} from 'lucide-react';
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

export type { Project };

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  onAddProject: () => void;
  onRenameProject: (id: string, name: string) => void;
  onRemoveProject: (id: string) => void;
  settingsActive: boolean;
  onOpenSettings: () => void;
  hasUpdate?: boolean;
}

export function Sidebar({
  collapsed,
  onToggle,
  projects,
  selectedProject,
  onSelectProject,
  onAddProject,
  onRenameProject,
  onRemoveProject,
  settingsActive,
  onOpenSettings,
  hasUpdate = false,
}: SidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startRename(project: Project) {
    setRenamingId(project.id);
    setRenameValue(project.name);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitRename(id: string) {
    const trimmed = renameValue.trim();
    if (trimmed) onRenameProject(id, trimmed);
    setRenamingId(null);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === 'Enter') commitRename(id);
    if (e.key === 'Escape') setRenamingId(null);
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar-background transition-all duration-200 ease-out',
        collapsed ? 'w-[var(--app-sidebar-collapsed)]' : 'w-[var(--app-sidebar-width)]'
      )}
    >
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-sidebar-border px-3">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              OpenCode Go
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed && 'mx-auto'
          )}
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Project list */}
      <nav className="flex-1 overflow-y-auto py-3">
        {/* Section header */}
        <div className="mb-2 flex items-center justify-between px-3">
          {!collapsed && (
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              工作目录
            </span>
          )}
          <button
            onClick={onAddProject}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
              collapsed && 'mx-auto'
            )}
            title="添加工作目录"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Projects */}
        <ul className="space-y-0.5 px-2">
          {projects.map((project) => (
            <li key={project.id} className="relative">
              {renamingId === project.id ? (
                <div className="mx-1 flex items-center gap-2 rounded-md bg-sidebar-accent px-2 py-1.5">
                  <FolderOpen className="h-4 w-4 shrink-0 text-sidebar-accent-foreground/60" />
                  <input
                    ref={inputRef}
                    className="min-w-0 flex-1 bg-transparent text-sm text-sidebar-accent-foreground outline-none"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(project.id)}
                    onKeyDown={(e) => handleRenameKeyDown(e, project.id)}
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => onSelectProject(project)}
                  className={cn(
                    'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-all duration-150',
                    'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    selectedProject?.id === project.id &&
                      'bg-sidebar-accent/80 text-sidebar-accent-foreground'
                  )}
                  title={collapsed ? project.name : undefined}
                >
                  <FolderOpen
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      selectedProject?.id === project.id
                        ? 'text-primary'
                        : 'text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground/70'
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1 truncate">{project.name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <span
                            role="button"
                            tabIndex={0}
                            className="shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                          </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-28">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              startRename(project);
                            }}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            重命名
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(project);
                            }}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            移除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </button>
              )}
            </li>
          ))}

          {/* Empty state */}
          {projects.length === 0 && !collapsed && (
            <li className="px-1 py-4">
              <button
                onClick={onAddProject}
                className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border/60 py-6 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-accent/30 hover:text-foreground"
              >
                <FolderOpen className="h-5 w-5" />
                <span className="text-xs">添加工作目录</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Footer: Settings */}
      <div className="shrink-0 border-t border-sidebar-border p-2">
        <button
          onClick={onOpenSettings}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
            'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            settingsActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
            collapsed && 'justify-center'
          )}
          title="设置"
        >
          <Settings className="relative h-4 w-4 shrink-0" />
          {!collapsed && <span>设置</span>}
          {!collapsed && hasUpdate && (
            <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
          {collapsed && hasUpdate && (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {/* Delete confirmation dialog */}
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
    </aside>
  );
}