import React, { useState, useEffect } from 'react';
import { MainArea } from '@/components/layout/MainArea';
import { UpdateDialog } from '@/components/update/UpdateDialog';
import { Toaster } from '@/components/ui/Toast';
import { useProxyPort } from '@/hooks/useProxyPort';
import { useSettings } from '@/hooks/useSettings';
import { useProjects } from '@/hooks/useProjects';
import { useTheme } from '@/hooks/useTheme';
import { useUpdater } from '@/hooks/useUpdater';

export function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showDebugTrigger, setShowDebugTrigger] = useState(() => {
    const stored = localStorage.getItem('showDebugTrigger');
    return stored === 'true';
  });
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  const proxyPort = useProxyPort();
  const settings = useSettings(proxyPort);
  const { projects, addProject, removeProject, renameProject } = useProjects();
  const { state: updateState, checkForUpdates } = useUpdater();

  useTheme();

  useEffect(() => {
    localStorage.setItem('showDebugTrigger', String(showDebugTrigger));
  }, [showDebugTrigger]);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  useEffect(() => {
    if (
      (updateState.status === 'available' && updateState.forced) ||
      updateState.status === 'downloading' ||
      updateState.status === 'downloaded' ||
      (updateState.status === 'error' && updateState.forced)
    ) {
      setShowUpdateDialog(true);
    }
  }, [updateState]);

  const handleAddProject = async () => {
    const path = await window.electronAPI.openDirectory();
    if (path) addProject(path);
  };

  return (
    <div className="flex overflow-hidden flex-col w-screen h-screen bg-background">
      <MainArea
        showSettings={showSettings}
        onShowSettings={setShowSettings}
        settings={settings}
        showDebugTrigger={showDebugTrigger}
        onShowDebugTriggerChange={setShowDebugTrigger}
        onRequestShowUpdateDialog={() => setShowUpdateDialog(true)}
        updateState={updateState}
        projects={projects}
        onAddProject={handleAddProject}
        onRemoveProject={removeProject}
        onRenameProject={renameProject}
        hasUpdate={updateState.status === 'available'}
      />
      <UpdateDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog} />
      <Toaster />
    </div>
  );
}
