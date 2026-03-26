import { useCallback, useRef } from 'react';
import { useProxyPort } from './useProxyPort';

interface LoggerOptions {
  context?: string;
  enabled?: boolean;
}

interface Logger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * 全局日志 hook，将日志发送到主进程并显示在 DebugDrawer 中
 * @param context 日志上下文前缀（如 'ChatArea'、'MessageList' 等）
 * @param options.enabled 是否启用远程日志（默认 true），设为 false 时只使用 console
 */
export function useLogger(context?: string, options?: LoggerOptions): Logger {
  const proxyPort = useProxyPort();
  const enabled = options?.enabled !== false;
  const contextRef = useRef(context || options?.context);

  const sendLog = useCallback(
    async (level: 'log' | 'warn' | 'error', args: unknown[]) => {
      // 先输出到浏览器控制台
      const prefix = contextRef.current ? `[${contextRef.current}]` : '';
      const consoleArgs = prefix ? [prefix, ...args] : args;
      console[level](...consoleArgs);

      // 如果未启用或无法连接，直接返回
      if (!enabled || !proxyPort) return;

      // 格式化参数为字符串
      const message = args
        .map((arg) => {
          if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}\n${arg.stack ?? ''}`;
          }
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(' ');

      // 发送到主进程（异步，不阻塞）
      try {
        await fetch(`http://127.0.0.1:${proxyPort}/api/debug/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level,
            message,
            context: contextRef.current,
          }),
        });
      } catch (e) {
        // 静默失败，避免日志系统本身产生错误
      }
    },
    [proxyPort, enabled]
  );

  const log = useCallback(
    (...args: unknown[]) => {
      sendLog('log', args);
    },
    [sendLog]
  );

  const warn = useCallback(
    (...args: unknown[]) => {
      sendLog('warn', args);
    },
    [sendLog]
  );

  const error = useCallback(
    (...args: unknown[]) => {
      sendLog('error', args);
    },
    [sendLog]
  );

  return { log, warn, error };
}
