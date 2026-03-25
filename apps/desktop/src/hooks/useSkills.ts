import { useState, useEffect, useCallback } from 'react';
import type { Skill } from '@/types/skill';

export function useSkills(directory?: string): {
  skills: Skill[];
  loading: boolean;
  reload: () => void;
} {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getSkills(directory);
      setSkills(result);
    } catch (e) {
      console.error('[useSkills] load error', e);
    } finally {
      setLoading(false);
    }
  }, [directory]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onSkillsUpdated((updatedDirectory) => {
      if (!updatedDirectory || updatedDirectory === directory) void load();
    });
    return unsubscribe;
  }, [directory, load]);

  return { skills, loading, reload: load };
}
