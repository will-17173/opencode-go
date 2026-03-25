import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/session.dart';
import 'connection_provider.dart';

final directoriesProvider = FutureProvider<List<String>>((ref) async {
  final client = ref.watch(apiClientProvider);
  if (client == null) return [];
  return client.getDirectories();
});

final selectedDirectoryProvider = StateProvider<String?>((ref) => null);

final sessionsProvider =
    FutureProvider.family<List<Session>, String>((ref, directory) async {
  final client = ref.watch(apiClientProvider);
  if (client == null) return [];
  return client.getSessions(directory: directory);
});
