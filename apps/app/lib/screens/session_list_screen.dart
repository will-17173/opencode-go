import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_slidable/flutter_slidable.dart';

import '../models/session.dart';
import '../providers/chat_provider.dart';
import '../providers/connection_provider.dart';
import '../providers/sessions_provider.dart';
import '../widgets/common/app_empty_state.dart';
import '../widgets/common/app_error_state.dart';
import '../widgets/common/app_loading_state.dart';
import '../widgets/common/app_scaffold.dart';
import '../widgets/home/session_list_section.dart';
import '../widgets/home/session_list_tile.dart';

class SessionListScreen extends ConsumerStatefulWidget {
  final String directory;

  const SessionListScreen({super.key, required this.directory});

  @override
  ConsumerState<SessionListScreen> createState() => _SessionListScreenState();
}

class _SessionListScreenState extends ConsumerState<SessionListScreen> {
  String? _busySessionId;

  @override
  Widget build(BuildContext context) {
    final directory = widget.directory;
    final dirName = directory.split('/').last;
    final sessionsAsync = ref.watch(sessionsProvider(directory));
    final pinnedIdsAsync = ref.watch(pinnedSessionIdsProvider(directory));

    return AppScaffold(
      appBar: AppBar(
        title: Text(dirName),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(pinnedSessionIdsProvider(directory));
              ref.invalidate(sessionsProvider(directory));
            },
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
          onRetry: () {
            ref.invalidate(pinnedSessionIdsProvider(directory));
            ref.invalidate(sessionsProvider(directory));
          },
        ),
        data: (sessions) {
          if (sessions.isEmpty) {
            return const AppEmptyState(
              icon: Icons.history_outlined,
              title: '暂无历史会话',
              message: '在这个工作目录下还没有历史对话，点击右下角即可开始新的会话。',
            );
          }

          final pinnedIds = pinnedIdsAsync.valueOrNull ?? const <String>{};

          return SessionListSection(
            children: sessions
                .map(
                  (session) => _SessionTile(
                    session: session,
                    directory: directory,
                    isPinned: pinnedIds.contains(session.id),
                    isBusy: _busySessionId == session.id,
                    onDelete: () => _handleDeleteSession(session),
                    onTogglePin: () => _handleTogglePin(session.id),
                  ),
                )
                .toList(),
          );
        },
      ),
    );
  }

  Future<void> _handleTogglePin(String sessionId) async {
    if (_busySessionId != null) return;

    setState(() {
      _busySessionId = sessionId;
    });

    final store = ref.read(pinnedSessionsStoreProvider);
    await store.togglePinnedSession(widget.directory, sessionId);

    if (!mounted) return;

    ref.read(pinnedSessionsRefreshProvider.notifier).state++;
    setState(() {
      _busySessionId = null;
    });
  }

  Future<void> _handleDeleteSession(Session session) async {
    if (_busySessionId != null) return;

    setState(() {
      _busySessionId = session.id;
    });

    final messenger = ScaffoldMessenger.of(context);
    final client = ref.read(apiClientProvider).valueOrNull;

    if (client == null) {
      messenger.showSnackBar(const SnackBar(content: Text('当前未连接，无法删除会话')));
      setState(() {
        _busySessionId = null;
      });
      return;
    }

    final deleted = await client.deleteSession(session.id, widget.directory);

    if (!mounted) return;

    if (deleted) {
      await ref
          .read(pinnedSessionsStoreProvider)
          .removePinnedSession(widget.directory, session.id);

      final currentSessionId = ref.read(currentSessionIdProvider);
      if (currentSessionId == session.id) {
        ref.read(chatProvider.notifier).stop();
        ref.read(chatProvider.notifier).clear();
        ref.read(currentSessionIdProvider.notifier).state = null;
      }

      ref.read(pinnedSessionsRefreshProvider.notifier).state++;
      ref.invalidate(sessionsProvider(widget.directory));
      ref.invalidate(directoriesProvider);
      messenger.showSnackBar(const SnackBar(content: Text('会话已删除')));
    } else {
      messenger.showSnackBar(const SnackBar(content: Text('删除会话失败')));
    }

    setState(() {
      _busySessionId = null;
    });
  }
}

class _SessionTile extends ConsumerWidget {
  final Session session;
  final String directory;
  final bool isPinned;
  final bool isBusy;
  final Future<void> Function() onDelete;
  final Future<void> Function() onTogglePin;

  const _SessionTile({
    required this.session,
    required this.directory,
    required this.isPinned,
    required this.isBusy,
    required this.onDelete,
    required this.onTogglePin,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;

    return Slidable(
      key: ValueKey(session.id),
      groupTag: directory,
      enabled: !isBusy,
      closeOnScroll: true,
      endActionPane: ActionPane(
        motion: const DrawerMotion(),
        extentRatio: 0.46,
        children: [
          SlidableAction(
            onPressed: (_) => onTogglePin(),
            backgroundColor: colorScheme.secondaryContainer,
            foregroundColor: colorScheme.onSecondaryContainer,
            icon: isPinned ? Icons.push_pin : Icons.push_pin_outlined,
            label: isPinned ? '取消置顶' : '置顶',
            borderRadius: BorderRadius.zero,
          ),
          SlidableAction(
            onPressed: (_) => onDelete(),
            backgroundColor: colorScheme.error,
            foregroundColor: colorScheme.onError,
            icon: Icons.delete_outline,
            label: '删除',
            borderRadius: BorderRadius.zero,
          ),
        ],
      ),
      child: SessionListTile(
        session: session,
        subtitle: session.updatedAt != null ? _formatDate(session.updatedAt!) : '未记录更新时间',
        trailing: isBusy
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Icon(
                isPinned ? Icons.push_pin : Icons.chevron_right,
                color: isPinned ? colorScheme.primary : null,
              ),
        onTap: isBusy
            ? null
            : () {
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
      ),
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
