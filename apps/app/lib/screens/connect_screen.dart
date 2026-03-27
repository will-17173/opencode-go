import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';

import '../providers/connection_provider.dart';
import '../services/api_client.dart';
import '../theme/app_spacing.dart';
import '../widgets/common/app_loading_state.dart';
import '../widgets/common/app_scaffold.dart';
import '../widgets/connect/connect_form_card.dart';
import '../widgets/connect/connect_header.dart';
import '../widgets/connect/connect_status_banner.dart';
import '../widgets/connect/pairing_code_field.dart';
import '../widgets/connect/server_host_field.dart';

class ConnectScreen extends ConsumerStatefulWidget {
  const ConnectScreen({super.key});

  @override
  ConsumerState<ConnectScreen> createState() => _ConnectScreenState();
}

class _ConnectScreenState extends ConsumerState<ConnectScreen> {
  final _ipController = TextEditingController();
  final _portController = TextEditingController();
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

    // 判断是否曾经连接过
    final hasConnectedBefore = host.isNotEmpty;

    if (hasConnectedBefore) {
      final parts = host.split(':');
      if (parts.length == 2) {
        _ipController.text = parts[0];
        _portController.text = parts[1];
      } else {
        _ipController.text = host;
      }
    } else {
      // 从未连接过，设置默认端口
      _portController.text = '38096';
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

      final client = await ApiClient.create('http://$host', code);
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

      final notifier = ref.read(connectionProvider.notifier);
      await notifier.saveConnection(host, code);
      await client.registerDevice();

      if (!mounted) return;
      setState(() => _loading = false);
      Navigator.of(context).pushReplacementNamed('/home');
    } catch (_) {
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
      return const Scaffold(body: AppLoadingState(message: '正在读取上次成功的连接配置'));
    }

    return AppScaffold(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: AppSpacing.xxl),
          const ConnectHeader(),
          const SizedBox(height: AppSpacing.xxl),
          ConnectFormCard(
            children: [
              ServerHostField(
                controller: _ipController,
                labelText: 'IP 地址',
                hintText: '例如：192.168.1.100',
                icon: Icons.lan_outlined,
                keyboardType: TextInputType.url,
                onSubmitted: (_) => _connect(),
              ),
              const SizedBox(height: AppSpacing.md),
              ServerHostField(
                controller: _portController,
                labelText: '端口',
                hintText: '38096',
                icon: Icons.settings_ethernet,
                keyboardType: TextInputType.number,
                onSubmitted: (_) => _connect(),
              ),
              const SizedBox(height: AppSpacing.md),
              PairingCodeField(
                controller: _codeController,
                onSubmitted: (_) => _connect(),
              ),
              if (_error != null) ...[
                const SizedBox(height: AppSpacing.md),
                ConnectStatusBanner(message: _error!),
              ],
              const SizedBox(height: AppSpacing.lg),
              FilledButton(
                onPressed: _loading ? null : _connect,
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('连接到桌面端'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
