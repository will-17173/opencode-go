import { useState, useEffect, useCallback } from 'react';
import { useProxyPort } from './useProxyPort';

export interface Project {
  id: string;
  name: string;
  path: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const proxyPort = useProxyPort();

  useEffect(() => {
    if (!proxyPort) return;
    fetch(`http://127.0.0.1:${proxyPort}/api/projects`)
      .then((res) => res.json())
      .then((data) => {
        setProjects(data as Project[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [proxyPort]);

  const addProject = useCallback(async (path: string) => {
    if (!proxyPort) return;
    const res = await fetch(`http://127.0.0.1:${proxyPort}/api/projects/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    const data = await res.json();
    setProjects(data as Project[]);
  }, [proxyPort]);

  const renameProject = useCallback(async (id: string, name: string) => {
    if (!proxyPort) return;
    const res = await fetch(`http://127.0.0.1:${proxyPort}/api/projects/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    });
    const data = await res.json();
    setProjects(data as Project[]);
  }, [proxyPort]);

  const removeProject = useCallback(async (id: string) => {
    if (!proxyPort) return;
    const res = await fetch(`http://127.0.0.1:${proxyPort}/api/projects/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setProjects(data as Project[]);
  }, [proxyPort]);

  return { projects, loading, addProject, renameProject, removeProject };
}