export {};

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

declare global {
  interface Window {
    electronAPI: {
      getProxyPort: () => Promise<number>;
      openDirectory: () => Promise<string | null>;
      openPath: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      openExternalUrl: (url: string) => Promise<{ success: boolean; error?: string }>;
      getAppVersion: () => Promise<string>;
      checkForUpdates: () => Promise<void>;
      startDownload: () => Promise<void>;
      quitAndInstall: () => Promise<void>;
      onUpdateStatus: (callback: (event: UpdateStatusEvent) => void) => () => void;
      getSkills: (directory?: string) => Promise<Skill[]>;
      importSkill: (
        filePath: string,
        scope: 'global' | 'project',
        directory?: string,
        overwrite?: boolean,
      ) => Promise<{ ok: boolean; error?: string }>;
      deleteSkill: (
        name: string,
        scope: 'global' | 'project',
        directory?: string,
      ) => Promise<void>;
      openSkillsDir: (scope: 'global' | 'project', directory?: string) => Promise<void>;
      onSkillsUpdated: (callback: (directory?: string) => void) => () => void;
      openLogFile: () => Promise<void>;
    };
  }

  // Electron webview 元素类型定义
  interface WebviewElement extends HTMLElement {
    src: string;
    addEventListener(event: 'did-finish-load', listener: () => void): void;
    addEventListener(event: 'did-fail-load', listener: (event: Event) => void): void;
    removeEventListener(event: 'did-finish-load', listener: () => void): void;
    removeEventListener(event: 'did-fail-load', listener: (event: Event) => void): void;
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<WebviewElement>, WebviewElement> & {
        src?: string;
      };
    }
  }
}
