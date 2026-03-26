import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/connection_provider.dart';
import '../providers/sessions_provider.dart';
import '../screens/session_list_screen.dart';
import '../widgets/common/app_empty_state.dart';
import '../widgets/common/app_error_state.dart';
import '../widgets/common/app_loading_state.dart';
import '../widgets/common/app_scaffold.dart';
import '../widgets/home/home_header.dart';
import '../widgets/home/project_list_section.dart';
import '../widgets/home/project_list_tile.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    final directoriesAsync = ref.watch(directoriesProvider);

    return AppScaffold(
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const HomeHeader(
            title: '工作目录',
            subtitle: '选择桌面端已经开始使用的目录，查看历史会话或继续新的对话。',
          ),
          directoriesAsync.when(
            loading: () => const AppLoadingState(message: '正在同步桌面端的工作目录列表'),
            error: (e, _) => AppErrorState(
              message: '目录加载失败：$e',
              onRetry: () => ref.invalidate(directoriesProvider),
            ),
            data: (dirs) {
              if (dirs.isEmpty) {
                return const AppEmptyState(
                  icon: Icons.folder_off_outlined,
                  title: '暂无工作目录',
                  message: '请先在 PC 端开始一个对话，随后这里会显示可继续的工作目录。',
                );
              }

              return ProjectListSection(
                children: dirs.map((dir) {
                  final name = dir.split('/').last;
                  return ProjectListTile(
                    title: name,
                    subtitle: dir,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => SessionListScreen(directory: dir),
                        ),
                      );
                    },
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}
