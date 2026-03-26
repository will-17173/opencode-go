import { contextBridge, ipcRenderer } from 'electron';

type UpdateStatusEvent =
  | { type: 'checking' }
  | { type: 'available'; payload: { version: string; releaseNotes: string | string[]; forced: boolean } }
  | { type: 'not-available' }
  | { type: 'progress'; payload: { percent: number } }
  | { type: 'downloaded' }
  | { type: 'error'; payload: { message: string; forced: boolean } };

interface Skill {
  name: string;
  description: string;
  trigger?: string;
  content: string;
  scope: 'builtin' | 'global' | 'project';
  path: string;
  version?: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
  getProxyPort: (): Promise<number> => ipcRenderer.invoke('get-proxy-port'),
  openDirectory: (): Promise<string | null> => ipcRenderer.invoke('open-directory'),
  openPath: (filePath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('open-path', filePath),
  openExternalUrl: (url: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('open-external-url', url),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: (): Promise<void> => ipcRenderer.invoke('check-for-updates'),
  startDownload: (): Promise<void> => ipcRenderer.invoke('start-download'),
  quitAndInstall: (): Promise<void> => ipcRenderer.invoke('quit-and-install'),
  onUpdateStatus: (callback: (event: UpdateStatusEvent) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, event: UpdateStatusEvent) => callback(event);
    ipcRenderer.on('update-status', listener);
    return () => ipcRenderer.removeListener('update-status', listener);
  },
  getSkills: (directory?: string): Promise<Skill[]> =>
    ipcRenderer.invoke('get-skills', directory),
  importSkill: (
    filePath: string,
    scope: 'global' | 'project',
    directory?: string,
    overwrite?: boolean,
  ): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('import-skill', filePath, scope, directory, overwrite),
  deleteSkill: (
    name: string,
    scope: 'global' | 'project',
    directory?: string,
  ): Promise<void> =>
    ipcRenderer.invoke('delete-skill', name, scope, directory),
  openSkillsDir: (
    scope: 'global' | 'project',
    directory?: string,
  ): Promise<void> =>
    ipcRenderer.invoke('open-skills-dir', scope, directory),
  openLogFile: (): Promise<void> => ipcRenderer.invoke('open-log-file'),
  onSkillsUpdated: (callback: (directory?: string) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, directory: string | null) =>
      callback(directory ?? undefined);
    ipcRenderer.on('skills-updated', listener);
    return () => ipcRenderer.removeListener('skills-updated', listener);
  },
});

