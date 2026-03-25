import 'dart:async';
import 'package:dio/dio.dart';
import '../models/session.dart';
import '../models/message.dart';
import 'sse_parser.dart';

class ApiClient {
  final Dio _dio;
  final String baseUrl;
  final String pairingCode;

  ApiClient(this.baseUrl, this.pairingCode)
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 30),
        )) {
    // 添加拦截器：自动附加 X-Pairing-Code 请求头
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (pairingCode.isNotEmpty) {
          options.headers['X-Pairing-Code'] = pairingCode;
        }
        handler.next(options);
      },
    ));
  }

  Future<bool> testConnection() async {
    try {
      final response = await _dio.get('/api/models');
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<List<Session>> getSessions({String? directory}) async {
    final params = directory != null ? {'directory': directory} : null;
    final response = await _dio.get<dynamic>(
      '/api/sessions',
      queryParameters: params,
    );
    final data = response.data;
    final List<dynamic> list = data is List ? data : (data['sessions'] as List<dynamic>? ?? []);
    return list
        .map((e) => Session.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<String>> getDirectories() async {
    try {
      final response = await _dio.get<List<dynamic>>('/api/projects');
      final data = response.data ?? [];
      return data
          .map((e) => (e as Map<String, dynamic>)['path'] as String)
          .where((p) => p.isNotEmpty)
          .toList();
    } catch (_) {
      // Fallback: 从 sessions 提取 directory（兼容旧逻辑）
      final sessions = await getSessions();
      final dirs = sessions.map((s) => s.directory).where((d) => d.isNotEmpty).toSet().toList();
      dirs.sort();
      return dirs;
    }
  }

  Future<List<ChatMessage>> getSessionMessages(
      String sessionId, String directory) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/sessions/$sessionId/messages',
      queryParameters: {'directory': directory},
    );
    final data = response.data ?? {};
    final parts = (data['parts'] as List<dynamic>?) ?? [];

    final msgMap = <String, Map<String, dynamic>>{};
    for (final part in parts) {
      final p = part as Map<String, dynamic>;
      final msgId = p['messageID'] as String;
      if (!msgMap.containsKey(msgId)) {
        msgMap[msgId] = {
          'id': msgId,
          'role': p['role'],
          'parts': <MessagePart>[],
          'toolSteps': <ToolStep>[],
        };
      }
      final entry = msgMap[msgId]!;
      if (p['type'] == 'text' && p['text'] != null && p['synthetic'] != true) {
        (entry['parts'] as List<MessagePart>).add(MessagePart.fromJson(p));
      } else if (p['type'] == 'file' && p['url'] != null && p['role'] == 'user') {
        (entry['parts'] as List<MessagePart>).add(MessagePart.fromJson(p));
      } else if (p['type'] == 'tool' && p['role'] == 'assistant') {
        final state = (p['state'] as Map<String, dynamic>?) ?? {};
        final status = (state['status'] as String?) ?? 'unknown';
        (entry['toolSteps'] as List<ToolStep>).add(ToolStep(
          id: (p['partID'] as String?) ?? '$msgId-${p['tool']}',
          tool: (p['tool'] as String?) ?? '',
          title: (state['title'] as String?) ?? (p['tool'] as String?) ?? '工具调用',
          status: status == 'running' ? 'completed' : status,
        ));
      }
    }

    return msgMap.values.map((m) {
      final role = (m['role'] as String) == 'user'
          ? MessageRole.user
          : MessageRole.assistant;
      return ChatMessage(
        id: m['id'] as String,
        role: role,
        parts: m['parts'] as List<MessagePart>,
        toolSteps: m['toolSteps'] as List<ToolStep>,
      );
    }).toList();
  }

  /// [onSessionId] 首次创建会话时回调 session ID（从响应头 X-Session-Id 获取）
  Stream<SseEvent> sendMessage({
    required String text,
    String? sessionId,
    required String directory,
    List<Map<String, dynamic>> files = const [],
    void Function(String sessionId)? onSessionId,
  }) {
    final body = {
      'messages': [
        {
          'role': 'user',
          'parts': [
            {'type': 'text', 'text': text},
            ...files,
          ],
        }
      ],
      'sessionId': sessionId,
      'directory': directory,
    };

    final controller = StreamController<SseEvent>();

    _dio
        .post<ResponseBody>(
      '/api/chat',
      data: body,
      options: Options(
        responseType: ResponseType.stream,
        headers: {'Accept': 'text/event-stream'},
      ),
    )
        .then((response) {
      final newSessionId = response.headers.value('x-session-id');
      if (newSessionId != null && sessionId == null) {
        onSessionId?.call(newSessionId);
      }
      final byteStream = response.data!.stream;
      parseSseStream(byteStream).listen(
        controller.add,
        onError: controller.addError,
        onDone: controller.close,
      );
    }).catchError((Object e) {
      controller.addError(e);
    });

    return controller.stream;
  }

  Future<void> abortSession(String sessionId) async {
    try {
      await _dio.post('/api/sessions/$sessionId/abort');
    } catch (_) {}
  }

  Future<bool> deleteSession(String sessionId, String directory) async {
    try {
      final response = await _dio.delete(
        '/api/sessions/$sessionId',
        queryParameters: {'directory': directory},
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
