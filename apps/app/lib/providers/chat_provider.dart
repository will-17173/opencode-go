import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/message.dart';
import 'connection_provider.dart';

final currentSessionIdProvider = StateProvider<String?>((ref) => null);

final chatLoadingProvider = StateProvider<bool>((ref) => false);

class ChatNotifier extends Notifier<List<ChatMessage>> {
  StreamSubscription<dynamic>? _sseSubscription;

  @override
  List<ChatMessage> build() => [];

  void setMessages(List<ChatMessage> messages) {
    state = messages;
  }

  void clear() {
    state = [];
  }

  Future<void> sendMessage({
    required String text,
    required String directory,
    List<Map<String, dynamic>> files = const [],
  }) async {
    final client = ref.read(apiClientProvider);
    if (client == null) return;

    final currentSessionId = ref.read(currentSessionIdProvider);

    final userMsg = ChatMessage(
      id: 'user-${DateTime.now().millisecondsSinceEpoch}',
      role: MessageRole.user,
      parts: [MessagePart(type: 'text', text: text)],
    );
    state = [...state, userMsg];

    final assistantId = 'assistant-${DateTime.now().millisecondsSinceEpoch}';
    final assistantMsg = ChatMessage(
      id: assistantId,
      role: MessageRole.assistant,
      parts: [],
      isStreaming: true,
    );
    state = [...state, assistantMsg];

    ref.read(chatLoadingProvider.notifier).state = true;

    String accumulatedText = '';
    final toolSteps = <String, ToolStep>{};

    _sseSubscription?.cancel();
    _sseSubscription = client
        .sendMessage(
          text: text,
          sessionId: currentSessionId,
          directory: directory,
          files: files,
          onSessionId: (newId) {
            ref.read(currentSessionIdProvider.notifier).state = newId;
          },
        )
        .listen(
          (event) {
            if (event.data == '[DONE]') return;
            try {
              final json = jsonDecode(event.data) as Map<String, dynamic>;
              final type = json['type'] as String?;

              if (type == 'text-delta' || type == 'text') {
                final delta = (json['delta'] ?? json['text'] ?? '') as String;
                accumulatedText += delta;
                _updateAssistantMessage(assistantId, accumulatedText, toolSteps);
              }

              if (type == 'tool-step') {
                final stepId = (json['id'] ?? json['tool']) as String? ?? '';
                toolSteps[stepId] = ToolStep(
                  id: stepId,
                  tool: (json['tool'] as String?) ?? '',
                  title: (json['title'] as String?) ?? (json['tool'] as String?) ?? '工具调用',
                  status: (json['status'] as String?) ?? 'running',
                );
                _updateAssistantMessage(assistantId, accumulatedText, toolSteps);
              }

              if (type == 'error') {
                final err = (json['error'] as String?)?.trim();
                if (err != null && err.isNotEmpty) {
                  accumulatedText = accumulatedText.isEmpty
                      ? '请求失败：$err'
                      : '$accumulatedText\n\n请求失败：$err';
                  _updateAssistantMessage(assistantId, accumulatedText, toolSteps);
                }
              }
            } catch (_) {}
          },
          onDone: () {
            ref.read(chatLoadingProvider.notifier).state = false;
            _finalizeAssistantMessage(assistantId, accumulatedText, toolSteps);
          },
          onError: (error) {
            ref.read(chatLoadingProvider.notifier).state = false;
            _finalizeAssistantMessage(assistantId, accumulatedText, toolSteps);
            final errStr = error.toString();
            if (errStr.contains('SocketException') ||
                errStr.contains('Connection refused') ||
                errStr.contains('Network is unreachable')) {
              ref.read(connectionLostProvider.notifier).state = true;
            }
          },
        );
  }

  void _updateAssistantMessage(
    String id,
    String text,
    Map<String, ToolStep> toolSteps,
  ) {
    state = [
      for (final msg in state)
        if (msg.id == id)
          msg.copyWith(
            parts: text.isNotEmpty
                ? [MessagePart(type: 'text', text: text)]
                : msg.parts,
            toolSteps: toolSteps.values.toList(),
            isStreaming: true,
          )
        else
          msg,
    ];
  }

  void _finalizeAssistantMessage(
    String id,
    String text,
    Map<String, ToolStep> toolSteps,
  ) {
    state = [
      for (final msg in state)
        if (msg.id == id)
          msg.copyWith(
            parts: text.isNotEmpty
                ? [MessagePart(type: 'text', text: text)]
                : msg.parts,
            toolSteps: toolSteps.values
                .map((s) => ToolStep(
                      id: s.id,
                      tool: s.tool,
                      title: s.title,
                      status: s.status == 'running' ? 'completed' : s.status,
                    ))
                .toList(),
            isStreaming: false,
          )
        else
          msg,
    ];
  }

  void stop() {
    _sseSubscription?.cancel();
    ref.read(chatLoadingProvider.notifier).state = false;
    state = [
      for (final msg in state)
        if (msg.isStreaming) msg.copyWith(isStreaming: false) else msg,
    ];
  }
}

final chatProvider = NotifierProvider<ChatNotifier, List<ChatMessage>>(
  ChatNotifier.new,
);
