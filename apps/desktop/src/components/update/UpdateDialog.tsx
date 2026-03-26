import React from 'react';
import { useUpdater } from '@/hooks/useUpdater';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

const DOWNLOAD_URL = 'https://opencodego.ai/updates';

interface UpdateDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UpdateDialog({ open: controlledOpen, onOpenChange }: UpdateDialogProps = {}) {
  const { state, startDownload, quitAndInstall, dismiss, dismissUntilTomorrow, checkForUpdates } = useUpdater();

  // 检测平台
  const isMac = /mac/i.test(navigator.userAgent);

  // 如果受控模式下 open 变为 true 但状态是 idle，自动触发检查更新
  React.useEffect(() => {
    if (controlledOpen && state.status === 'idle') {
      checkForUpdates();
    }
  }, [controlledOpen, state.status, checkForUpdates]);

  // 如果是受控模式，只根据 controlledOpen 判断；否则根据状态自动判断
  const isOpen = controlledOpen !== undefined
    ? controlledOpen
    : (
        state.status === 'available' ||
        state.status === 'downloading' ||
        state.status === 'downloaded' ||
        state.status === 'not-available' ||
        state.status === 'error'
      );

  // 但只有在特定状态下才显示内容
  const shouldShowContent =
    state.status === 'checking' ||
    state.status === 'available' ||
    state.status === 'downloading' ||
    state.status === 'downloaded' ||
    state.status === 'not-available' ||
    state.status === 'error';

  const handleDismiss = () => {
    // 只有在特定状态下才重置状态（not-available, error）
    // available 和 downloaded 状态保留，以便用户再次打开
    if (state.status === 'not-available' || state.status === 'error') {
      dismiss();
    }
    onOpenChange?.(false);
  };

  const handleDismissUntilTomorrow = () => {
    // "稍后提醒"始终重置状态
    dismissUntilTomorrow();
    onOpenChange?.(false);
  };

  const forced =
    (state.status === 'available' && state.forced) ||
    (state.status === 'downloading' && state.forced) ||
    (state.status === 'downloaded' && state.forced) ||
    (state.status === 'error' && state.forced);

  return (
    <AlertDialog
      open={isOpen && shouldShowContent}
      onOpenChange={(open) => {
        if (!open) {
          handleDismiss();
        }
      }}
    >
      <AlertDialogContent
        onEscapeKeyDown={forced ? (e) => e.preventDefault() : undefined}
      >
        {state.status === 'checking' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>正在检查更新...</AlertDialogTitle>
              <AlertDialogDescription>
                请稍候
              </AlertDialogDescription>
            </AlertDialogHeader>
          </>
        )}

        {state.status === 'available' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {state.forced ? '发现新版本（必须更新）' : `发现新版本 v${state.version}`}
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  {state.forced && (
                    <p className="mb-2 font-medium text-destructive">
                      当前版本过旧，需要更新到 v{state.version} 才能继续使用。
                    </p>
                  )}
                  {state.releaseNotes && Array.isArray(state.releaseNotes) && state.releaseNotes.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">更新内容：</p>
                      <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
                        {state.releaseNotes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    state.releaseNotes && typeof state.releaseNotes === 'string' && (
                      <p className="text-sm whitespace-pre-wrap">{state.releaseNotes}</p>
                    )
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {!state.forced && (
                <AlertDialogCancel onClick={handleDismissUntilTomorrow}>稍后提醒</AlertDialogCancel>
              )}
              <AlertDialogAction
                onClick={() => {
                  // 优先使用 downloadLinks 中的直接下载链接
                  if (state.downloadLinks) {
                    const downloadUrl = isMac ? state.downloadLinks.macos : state.downloadLinks.windows;

                    if (downloadUrl) {
                      window.open(downloadUrl, '_blank');
                      handleDismiss();
                      return;
                    }
                  }

                  // macOS 降级方案：打开下载页面目录
                  if (isMac) {
                    window.open(DOWNLOAD_URL, '_blank');
                    handleDismiss();
                  }
                  // Windows 使用 electron-updater 自动下载
                  else {
                    startDownload();
                  }
                }}
              >
                {isMac ? '前往下载' : '立即更新'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}

        {state.status === 'downloading' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>正在下载更新...</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="pt-2 space-y-3">
                  <Progress value={state.percent} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">{state.percent}%</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </>
        )}

        {state.status === 'downloaded' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>更新已就绪</AlertDialogTitle>
              <AlertDialogDescription>
                新版本下载完成，重启应用后生效。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {!state.forced && (
                <AlertDialogCancel onClick={handleDismiss}>稍后重启</AlertDialogCancel>
              )}
              <AlertDialogAction onClick={quitAndInstall}>立即重启</AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}

        {state.status === 'not-available' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>已是最新版本</AlertDialogTitle>
              <AlertDialogDescription>
                当前应用已是最新版本，无需更新。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleDismiss}>好的</AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}

        {state.status === 'error' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>更新失败</AlertDialogTitle>
              <AlertDialogDescription className="text-destructive">
                {state.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {!state.forced && (
                <AlertDialogCancel onClick={handleDismiss}>关闭</AlertDialogCancel>
              )}
              <AlertDialogAction onClick={checkForUpdates}>重试</AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
