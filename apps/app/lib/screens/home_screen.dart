import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/connection_provider.dart';
import '../providers/sessions_provider.dart';
import '../providers/chat_provider.dart';
import '../models/session.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    final directoriesAsync = ref.watch(directoriesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('OpenCode Go'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(directoriesProvider),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(connectionProvider.notifier).disconnect();
              if (context.mounted) {
                Navigator.of(context).pushReplacementNamed('/connect');
              }
            },
          ),
        ],
      ),
      body: directoriesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('加载失败: $e'),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: () => ref.invalidate(directoriesProvider),
                child: const Text('重试'),
              ),
            ],
          ),
        ),
        data: (dirs) {
          if (dirs.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  '暂无工作目录，请先在 PC 端开始一个对话',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          return ListView.separated(
            itemCount: dirs.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final dir = dirs[i];
              final name = dir.split('/').last;
              return ListTile(
                leading: const Icon(Icons.folder_outlined),
                title: Text(name, overflow: TextOverflow.ellipsis),
                subtitle: Text(
                  dir,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11),
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => SessionListScreen(directory: dir),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}

// 独立的会话列表页面
class SessionListScreen extends ConsumerWidget {
  final String directory;

  const SessionListScreen({super.key, required this.directory});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dirName = directory.split('/').last;
    final sessionsAsync = ref.watch(sessionsProvider(directory));

    return Scaffold(
      appBar: AppBar(
        title: Text(dirName),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(sessionsProvider(directory)),
          ),
        ],
      ),
      body: sessionsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('加载失败: $e')),
        data: (sessions) {
          if (sessions.isEmpty) {
            return const Center(child: Text('该目录暂无历史会话'));
          }
          return ListView.separated(
            itemCount: sessions.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final session = sessions[i];
              return _SessionTile(
                session: session,
                directory: directory,
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('新对话'),
        onPressed: () {
          ref.read(currentSessionIdProvider.notifier).state = null;
          ref.read(chatProvider.notifier).clear();
          Navigator.of(context).pushNamed(
            '/chat',
            arguments: {'directory': directory, 'sessionId': null},
          );
        },
      ),
    );
  }
}

class _SessionTile extends ConsumerWidget {
  final Session session;
  final String directory;

  const _SessionTile({required this.session, required this.directory});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListTile(
      leading: const Icon(Icons.chat_bubble_outline),
      title: Text(session.title, overflow: TextOverflow.ellipsis),
      subtitle: session.updatedAt != null
          ? Text(
              _formatDate(session.updatedAt!),
              style: const TextStyle(fontSize: 11),
            )
          : null,
      trailing: const Icon(Icons.chevron_right),
      onTap: () {
        ref.read(currentSessionIdProvider.notifier).state = session.id;
        ref.read(chatProvider.notifier).clear();
        Navigator.of(context).pushNamed(
          '/chat',
          arguments: {
            'directory': directory,
            'sessionId': session.id,
          },
        );
      },
    );
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inDays == 0) {
      return '今天 ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }
    if (diff.inDays == 1) return '昨天';
    return '${dt.month}/${dt.day}';
  }
}
