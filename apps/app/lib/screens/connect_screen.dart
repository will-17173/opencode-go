import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/connection_provider.dart';
import '../services/api_client.dart';

class ConnectScreen extends ConsumerStatefulWidget {
  const ConnectScreen({super.key});

  @override
  ConsumerState<ConnectScreen> createState() => _ConnectScreenState();
}

class _ConnectScreenState extends ConsumerState<ConnectScreen> {
  final _ipController = TextEditingController();
  final _portController = TextEditingController(text: '4097');
  final _codeController = TextEditingController();
  bool _loading = false;
  String? _error;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _loadSavedConfig();
  }

  Future<void> _loadSavedConfig() async {
    final prefs = await SharedPreferences.getInstance();
    final host = prefs.getString('connection_host') ??
        prefs.getString('last_successful_connection_host') ??
        '';
    final code = prefs.getString('pairingCode') ?? '';

    if (host.isNotEmpty) {
      final parts = host.split(':');
      if (parts.length == 2) {
        _ipController.text = parts[0];
        _portController.text = parts[1];
      } else {
        _ipController.text = host;
      }
    }
    if (code.isNotEmpty) {
      _codeController.text = code;
    }

    setState(() => _initialized = true);
  }

  @override
  void dispose() {
    _ipController.dispose();
    _portController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _connect() async {
    final ip = _ipController.text.trim();
    final port = _portController.text.trim();
    final code = _codeController.text.trim();

    if (ip.isEmpty || port.isEmpty) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    final host = '$ip:$port';

    try {
      // 第一步：通过 GET /api/health 验证 IP:Port 可达（不需要配对码）
      final healthDio = Dio(BaseOptions(
        baseUrl: 'http://$host',
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 10),
      ));

      try {
        final healthResponse = await healthDio.get('/api/health');
        if (healthResponse.statusCode != 200) {
          if (!mounted) return;
          setState(() {
            _loading = false;
            _error = '连接失败，请检查 IP 和端口是否正确，以及 OpenCode Go 是否在运行';
          });
          return;
        }
      } on DioException catch (_) {
        if (!mounted) return;
        setState(() {
          _loading = false;
          _error = '连接失败，请检查 IP 和端口是否正确，以及 OpenCode Go 是否在运行';
        });
        return;
      }

      // 第二步：带配对码发送请求，验证配对码正确
      final client = ApiClient('http://$host', code);
      try {
        await client.getSessions();
      } on DioException catch (e) {
        if (!mounted) return;
        if (e.response?.statusCode == 401) {
          setState(() {
            _loading = false;
            _error = '配对码错误，请重新输入';
          });
        } else {
          setState(() {
            _loading = false;
            _error = '验证失败，请检查网络连接';
          });
        }
        return;
      }

      // 两步均通过，直接保存连接信息并跳转（避免 connect() 内部重复验证）
      final notifier = ref.read(connectionProvider.notifier);
      await notifier.saveConnection(host, code);

      if (!mounted) return;
      setState(() => _loading = false);
      Navigator.of(context).pushReplacementNamed('/home');
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = '连接失败，请检查 IP 和端口是否正确，以及 OpenCode Go 是否在运行';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.computer, size: 64, color: Colors.blue),
              const SizedBox(height: 16),
              Text(
                'OpenCode Go',
                style: Theme.of(context).textTheme.headlineMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                '输入 PC 上 OpenCode 的地址',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _ipController,
                decoration: const InputDecoration(
                  labelText: 'IP 地址',
                  hintText: '例如：192.168.1.100',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.lan),
                ),
                keyboardType: TextInputType.url,
                onSubmitted: (_) => _connect(),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _portController,
                decoration: const InputDecoration(
                  labelText: '端口',
                  hintText: '4097',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.settings_ethernet),
                ),
                keyboardType: TextInputType.number,
                onSubmitted: (_) => _connect(),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _codeController,
                decoration: InputDecoration(
                  labelText: '配对码',
                  hintText: '6 位数字',
                  border: const OutlineInputBorder(),
                  errorText: _error,
                  prefixIcon: const Icon(Icons.pin),
                ),
                keyboardType: TextInputType.number,
                maxLength: 6,
                onSubmitted: (_) => _connect(),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _loading ? null : _connect,
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('连接'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
