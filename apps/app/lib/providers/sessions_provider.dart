import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/session.dart';
import '../services/pinned_sessions_store.dart';
import 'connection_provider.dart';

final pinnedSessionsStoreProvider = Provider<PinnedSessionsStore>((ref) {
  return PinnedSessionsStore();
});

final pinnedSessionsRefreshProvider = StateProvider<int>((ref) => 0);

final pinnedSessionIdsProvider =
    FutureProvider.family<Set<String>, String>((ref, directory) async {
  ref.watch(pinnedSessionsRefreshProvider);
  final store = ref.watch(pinnedSessionsStoreProvider);
  return store.getPinnedSessionIds(directory);
});

final directoriesProvider = FutureProvider<List<String>>((ref) async {
  final client = ref.watch(apiClientProvider).valueOrNull;
  if (client == null) return [];
  return client.getDirectories();
});

final selectedDirectoryProvider = StateProvider<String?>((ref) => null);

final sessionsProvider =
    FutureProvider.family<List<Session>, String>((ref, directory) async {
  final client = ref.watch(apiClientProvider).valueOrNull;
  if (client == null) return [];

  ref.watch(pinnedSessionsRefreshProvider);
  final sessions = await client.getSessions(directory: directory);
  final pinnedIds = await ref.watch(pinnedSessionIdsProvider(directory).future);

  final sorted = [...sessions];
  sorted.sort((a, b) {
    final aPinned = pinnedIds.contains(a.id);
    final bPinned = pinnedIds.contains(b.id);
    if (aPinned != bPinned) {
      return aPinned ? -1 : 1;
    }

    final aTime = a.updatedAt?.millisecondsSinceEpoch ?? 0;
    final bTime = b.updatedAt?.millisecondsSinceEpoch ?? 0;
    return bTime.compareTo(aTime);
  });

  return sorted;
});
