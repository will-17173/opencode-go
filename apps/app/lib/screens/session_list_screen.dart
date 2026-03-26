import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/session.dart';
import '../providers/chat_provider.dart';
import '../providers/sessions_provider.dart';
import '../widgets/common/app_empty_state.dart';
import '../widgets/common/app_error_state.dart';
import '../widgets/common/app_loading_state.dart';
import '../widgets/common/app_scaffold.dart';
import '../widgets/home/session_list_section.dart';
import '../widgets/home/session_list_tile.dart';

class SessionListScreen extends ConsumerWidget {
  final String directory;

  const SessionListScreen({super.key, required this.directory});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dirName = directory.split('/').last;
    final sessionsAsync = ref.watch(sessionsProvider(directory));

    return AppScaffold(
      appBar: AppBar(
        title: Text(dirName),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(sessionsProvider(directory)),
          ),
        ],
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
      child: sessionsAsync.when(
        loading: () => const AppLoadingState(message: '正在加载该目录下的历史会话'),
        error: (e, _) => AppErrorState(
          message: '无法加载历史会话：$e',
          onRetry: () => ref.invalidate(sessionsProvider(directory)),
        ),
        data: (sessions) {
          if (sessions.isEmpty) {
            return const AppEmptyState(
              icon: Icons.history_outlined,
              title: '暂无历史会话',
              message: '在这个工作目录下还没有历史对话，点击右下角即可开始新的会话。',
            );
          }

          return SessionListSection(
            children: sessions
                .map(
                  (session) => _SessionTile(
                    session: session,
                    directory: directory,
                  ),
                )
                .toList(),
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
    return SessionListTile(
      session: session,
      subtitle: session.updatedAt != null ? _formatDate(session.updatedAt!) : '未记录更新时间',
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
