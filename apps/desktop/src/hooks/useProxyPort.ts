import { useState, useEffect } from 'react';

let cachedPort: number | null = null;

export function useProxyPort() {
  const [port, setPort] = useState<number | null>(cachedPort);

  useEffect(() => {
    if (cachedPort !== null) {
      setPort(cachedPort);
      return;
    }

    // 检查 electronAPI 是否可用
    if (!window.electronAPI) {
      console.error('[useProxyPort] window.electronAPI is undefined. Preload script may not have loaded correctly.');
      return;
    }

    window.electronAPI.getProxyPort().then((p) => {
      cachedPort = p;
      setPort(p);
    }).catch((err) => {
      console.error('[useProxyPort] failed to get proxy port:', err);
    });
  }, []);

  return port;
}
