import { useState, useEffect, useCallback } from 'react';

type UpdateStatusEvent =
  | { type: 'checking' }
  | { type: 'available'; payload: { version: string; releaseNotes: string | string[]; forced: boolean; downloadUrl?: string } }
  | { type: 'not-available' }
  | { type: 'progress'; payload: { percent: number } }
  | { type: 'downloaded' }
  | { type: 'error'; payload: { message: string; forced: boolean } };

export type UpdateState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available'; version: string; releaseNotes: string | string[]; forced: boolean; downloadLinks?: { windows?: string; macos?: string } }
  | { status: 'not-available' }
  | { status: 'downloading'; percent: number; forced: boolean }
  | { status: 'downloaded'; forced: boolean }
  | { status: 'error'; message: string; forced: boolean };

export function useUpdater() {
  const [state, setState] = useState<UpdateState>({ status: 'idle' });

  useEffect(() => {
    const remove = window.electronAPI.onUpdateStatus((event: UpdateStatusEvent) => {
      switch (event.type) {
        case 'checking':
          setState({ status: 'checking' });
          break;
        case 'available':
          setState({
            status: 'available',
            version: event.payload.version,
            releaseNotes: event.payload.releaseNotes,
            forced: event.payload.forced,
            // 如果有 downloadUrl，根据平台设置到 downloadLinks
            downloadLinks: event.payload.downloadUrl
              ? {
                  macos: /mac/i.test(navigator.userAgent) ? event.payload.downloadUrl : undefined,
                  windows: /windows/i.test(navigator.userAgent) ? event.payload.downloadUrl : undefined
                }
              : undefined,
          });
          break;
        case 'not-available':
          setState({ status: 'not-available' });
          break;
        case 'progress':
          setState((prev) => ({
            status: 'downloading',
            percent: event.payload.percent,
            forced: prev.status === 'available' ? prev.forced
              : prev.status === 'downloading' ? prev.forced
              : false,
          }));
          break;
        case 'downloaded':
          setState((prev) => ({
            status: 'downloaded',
            forced: prev.status === 'downloading' ? prev.forced : false,
          }));
          break;
        case 'error':
          setState({ status: 'error', message: event.payload.message, forced: event.payload.forced });
          break;
      }
    });
    return remove;
  }, []);

  const checkForUpdates = useCallback(() => {
    setState({ status: 'checking' });
    window.electronAPI.checkForUpdates();
  }, []);

  const startDownload = useCallback(() => {
    window.electronAPI.startDownload();
  }, []);

  const openDownloadPage = useCallback(async (downloadLinks?: { windows?: string; macos?: string }) => {
    if (!downloadLinks) {
      console.warn('[updater] no download links available');
      return;
    }

    // 检测当前平台
    const isMac = /mac/i.test(navigator.userAgent);
    const downloadUrl = isMac ? downloadLinks.macos : downloadLinks.windows;

    if (downloadUrl) {
      console.log('[updater] opening download URL:', downloadUrl);
      await window.electronAPI.openExternalUrl(downloadUrl);
    } else {
      console.warn('[updater] no download URL for current platform');
    }
  }, []);

  const quitAndInstall = useCallback(() => {
    window.electronAPI.quitAndInstall();
  }, []);

  const dismiss = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  const dismissUntilTomorrow = useCallback(() => {
    // 保存今天忽略的版本信息
    if (state.status === 'available') {
      const today = new Date().toDateString();
      const dismissInfo = {
        date: today,
        version: state.version,
      };
      localStorage.setItem('update-dismissed-until', JSON.stringify(dismissInfo));
    }
    setState({ status: 'idle' });
  }, [state]);

  return { state, checkForUpdates, startDownload, openDownloadPage, quitAndInstall, dismiss, dismissUntilTomorrow };
}
