import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class PinnedSessionsStore {
  static const _storageKey = 'pinned_sessions_by_directory';

  Future<Set<String>> getPinnedSessionIds(String directory) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) return <String>{};

    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) return <String>{};

    final values = decoded[directory];
    if (values is! List) return <String>{};

    return values.whereType<String>().toSet();
  }

  Future<void> togglePinnedSession(String directory, String sessionId) async {
    final prefs = await SharedPreferences.getInstance();
    final data = await _readAll(prefs);
    final ids = {...(data[directory] ?? <String>{})};

    if (ids.contains(sessionId)) {
      ids.remove(sessionId);
    } else {
      ids.add(sessionId);
    }

    if (ids.isEmpty) {
      data.remove(directory);
    } else {
      data[directory] = ids;
    }

    await _writeAll(prefs, data);
  }

  Future<void> removePinnedSession(String directory, String sessionId) async {
    final prefs = await SharedPreferences.getInstance();
    final data = await _readAll(prefs);
    final ids = data[directory];
    if (ids == null || !ids.remove(sessionId)) return;

    if (ids.isEmpty) {
      data.remove(directory);
    }

    await _writeAll(prefs, data);
  }

  Future<Map<String, Set<String>>> _readAll(SharedPreferences prefs) async {
    final raw = prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) return <String, Set<String>>{};

    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) return <String, Set<String>>{};

    return decoded.map(
      (key, value) => MapEntry(
        key,
        value is List ? value.whereType<String>().toSet() : <String>{},
      ),
    );
  }

  Future<void> _writeAll(
    SharedPreferences prefs,
    Map<String, Set<String>> data,
  ) async {
    final encoded = jsonEncode(
      data.map((key, value) => MapEntry(key, value.toList()..sort())),
    );
    await prefs.setString(_storageKey, encoded);
  }
}
