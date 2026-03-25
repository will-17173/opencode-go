import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_client.dart';

const _keyHost = 'connection_host';
const _keyPairingCode = 'pairingCode';
const _keyLastSuccessfulHost = 'last_successful_connection_host';

class ConnectionNotifier extends AsyncNotifier<String?> {
  String _pairingCode = '';

  String get pairingCode => _pairingCode;

  @override
  Future<String?> build() async {
    return _loadSavedConnection();
  }

  Future<String?> _loadSavedConnection() async {
    final prefs = await SharedPreferences.getInstance();
    _pairingCode = prefs.getString(_keyPairingCode) ?? '';
    return prefs.getString(_keyHost);
  }

  Future<bool> connect(String host, String pairingCode) async {
    final client = ApiClient('http://$host', pairingCode);
    final ok = await client.testConnection();
    if (ok) {
      await saveConnection(host, pairingCode);
    }
    return ok;
  }

  /// 直接保存连接信息（已在外部验证过，无需再次 testConnection）
  Future<void> saveConnection(String host, String pairingCode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyHost, host);
    await prefs.setString(_keyLastSuccessfulHost, host);
    await prefs.setString(_keyPairingCode, pairingCode);
    _pairingCode = pairingCode;
    state = AsyncValue.data(host);
  }

  Future<void> savePairingCode(String code) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyPairingCode, code);
    _pairingCode = code;
  }

  Future<void> disconnect() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyHost);
    // 注意：断开连接时不清空 pairingCode 和最近成功连接地址（用于回填输入框）
    state = const AsyncValue.data(null);
  }
}

final connectionProvider =
    AsyncNotifierProvider<ConnectionNotifier, String?>(ConnectionNotifier.new);

final apiClientProvider = Provider<ApiClient?>((ref) {
  final conn = ref.watch(connectionProvider);
  final notifier = ref.watch(connectionProvider.notifier);
  if (conn.valueOrNull != null) {
    return ApiClient('http://${conn.valueOrNull}', notifier.pairingCode);
  }
  return null;
});

/// 连接丢失信号（断网时置为 true，UI 监听后跳回 ConnectScreen 并重置）
final connectionLostProvider = StateProvider<bool>((ref) => false);
