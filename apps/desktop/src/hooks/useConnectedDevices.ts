import { useState, useEffect, useCallback } from 'react';

export type ConnectedDeviceStatus = 'online' | 'recent' | 'offline';

export interface ConnectedDevice {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'unknown';
  appVersion?: string;
  firstSeenAt: number;
  lastSeenAt: number;
  status: ConnectedDeviceStatus;
}

interface ConnectedDevicesSummary {
  online: number;
  recent: number;
  offline: number;
}

interface ConnectedDevicesResponse {
  devices: ConnectedDevice[];
  summary: ConnectedDevicesSummary;
}

const EMPTY_SUMMARY: ConnectedDevicesSummary = {
  online: 0,
  recent: 0,
  offline: 0,
};

export function useConnectedDevices(proxyPort: number | null) {
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [summary, setSummary] = useState<ConnectedDevicesSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!proxyPort) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://127.0.0.1:${proxyPort}/api/connection/devices`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json() as ConnectedDevicesResponse;
      setDevices(data.devices ?? []);
      setSummary(data.summary ?? EMPTY_SUMMARY);
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取设备失败');
    } finally {
      setIsLoading(false);
    }
  }, [proxyPort]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (!proxyPort) return;
    const timer = setInterval(fetchDevices, 30000);
    return () => clearInterval(timer);
  }, [proxyPort, fetchDevices]);

  return {
    devices,
    summary,
    isLoading,
    error,
    refetch: fetchDevices,
  };
}
