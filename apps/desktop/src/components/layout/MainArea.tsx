import { Settings, X } from 'lucide-react';
import { ConnectionPanel } from '@/components/layout/ConnectionPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { cn } from '@/lib/utils';
import appIcon from '@/assets/icon.png';
import type { useSettings } from '@/hooks/useSettings';
import type { Project } from '@/hooks/useProjects';
import type { UpdateState } from '@/hooks/useUpdater';

interface MainAreaProps {
  showSettings: boolean;
  onShowSettings: (show: boolean) => void;
  settings: ReturnType<typeof useSettings>;
  showDebugTrigger: boolean;
  onShowDebugTriggerChange: (show: boolean) => void;
  onRequestShowUpdateDialog?: () => void;
  updateState: UpdateState;
  projects: Project[];
  onAddProject: () => void;
  onRemoveProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
  hasUpdate?: boolean;
}

export function MainArea({
  showSettings,
  onShowSettings,
  settings,
  showDebugTrigger,
  onShowDebugTriggerChange,
  onRequestShowUpdateDialog,
  updateState,
  projects,
  onAddProject,
  onRemoveProject,
  onRenameProject,
  hasUpdate = false,
}: MainAreaProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* Header - 极简导航 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <img
            src={appIcon}
            alt="OpenCode Go"
            className="h-8 w-8 rounded-xl"
          />
          <span className="text-lg font-semibold tracking-tight">
            OpenCode Go
          </span>
        </div>
        <button
          onClick={() => onShowSettings(!showSettings)}
          className={cn(
            'relative flex h-9 w-9 items-center justify-center rounded-full transition-colors',
            'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
          title={showSettings ? '关闭设置' : '设置'}
        >
          {showSettings ? <X className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
          {!showSettings && hasUpdate && (
            <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-primary" />
          )}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {showSettings ? (
          <SettingsPanel
            settings={settings}
            showDebugTrigger={showDebugTrigger}
            onShowDebugTriggerChange={onShowDebugTriggerChange}
            onRequestShowUpdateDialog={onRequestShowUpdateDialog}
            updateState={updateState}
          />
        ) : (
          <ConnectionPanel
            projects={projects}
            onAddProject={onAddProject}
            onRemoveProject={onRemoveProject}
            onRenameProject={onRenameProject}
          />
        )}
      </main>
    </div>
  );
}