import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers/connection_provider.dart';
import 'screens/connect_screen.dart';
import 'screens/home_screen.dart';
import 'screens/chat_screen.dart';

void main() {
  runApp(const ProviderScope(child: OpenCodeGoApp()));
}

class OpenCodeGoApp extends ConsumerWidget {
  const OpenCodeGoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'OpenCode Go',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const _AppEntry(),
      routes: {
        '/connect': (_) => const ConnectScreen(),
        '/home': (_) => const HomeScreen(),
        '/chat': (_) => const ChatScreen(),
      },
    );
  }
}

/// 根据已保存的连接配置决定显示 Connect 还是 Home，同时监听断网信号
class _AppEntry extends ConsumerStatefulWidget {
  const _AppEntry();

  @override
  ConsumerState<_AppEntry> createState() => _AppEntryState();
}

class _AppEntryState extends ConsumerState<_AppEntry> {
  @override
  Widget build(BuildContext context) {
    // 监听断网信号，触发时清除连接并跳回 ConnectScreen
    ref.listen(connectionLostProvider, (_, lost) {
      if (lost) {
        ref.read(connectionLostProvider.notifier).state = false;
        ref.read(connectionProvider.notifier).disconnect().then((_) {
          if (context.mounted) {
            Navigator.of(context).pushNamedAndRemoveUntil(
              '/connect',
              (_) => false,
            );
          }
        });
      }
    });

    final conn = ref.watch(connectionProvider);
    return conn.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => const ConnectScreen(),
      data: (host) =>
          host != null ? const HomeScreen() : const ConnectScreen(),
    );
  }
}
