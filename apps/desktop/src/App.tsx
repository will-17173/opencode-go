import React, { useState } from 'react';
import { MainArea } from '@/components/layout/MainArea';
import { Toaster } from '@/components/ui/Toast';
import { useProxyPort } from '@/hooks/useProxyPort';
import { useSettings } from '@/hooks/useSettings';
import { useProjects } from '@/hooks/useProjects';
import { useTheme } from '@/hooks/useTheme';

export function App() {
  const [showSettings, setShowSettings] = useState(false);

  const proxyPort = useProxyPort();
  const settings = useSettings(proxyPort);
  const { projects, addProject, removeProject, renameProject } = useProjects();

  useTheme();

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
        projects={projects}
        onAddProject={handleAddProject}
        onRemoveProject={removeProject}
        onRenameProject={renameProject}
      />
      <Toaster />
    </div>
  );
}