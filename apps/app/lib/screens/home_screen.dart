import 'package:flutter/material.dart';
import 'package:opencode_go/l10n/app_localizations.dart';
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
    final l10n = AppLocalizations.of(context)!;
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
          HomeHeader(
            title: l10n.homeTitle,
            subtitle: l10n.homeSubtitle,
          ),
          directoriesAsync.when(
            loading: () => AppLoadingState(message: l10n.homeLoading),
            error: (e, _) => AppErrorState(
              message: '${l10n.homeErrorPrefix}$e',
              onRetry: () => ref.invalidate(directoriesProvider),
            ),
            data: (dirs) {
              if (dirs.isEmpty) {
                return AppEmptyState(
                  icon: Icons.folder_off_outlined,
                  title: l10n.homeEmptyTitle,
                  message: l10n.homeEmptyMessage,
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
