enum MessageRole { user, assistant }

class MessagePart {
  final String type;
  final String? text;
  final String? url;
  final String? mediaType;
  final String? filename;

  const MessagePart({
    required this.type,
    this.text,
    this.url,
    this.mediaType,
    this.filename,
  });

  factory MessagePart.fromJson(Map<String, dynamic> json) {
    return MessagePart(
      type: json['type'] as String,
      text: json['text'] as String?,
      url: json['url'] as String?,
      mediaType: json['mime'] as String?,
      filename: json['filename'] as String?,
    );
  }
}

class ToolStep {
  final String id;
  final String tool;
  final String title;
  final String status;

  const ToolStep({
    required this.id,
    required this.tool,
    required this.title,
    required this.status,
  });
}

class ChatMessage {
  final String id;
  final MessageRole role;
  final List<MessagePart> parts;
  final List<ToolStep> toolSteps;
  final bool isStreaming;

  const ChatMessage({
    required this.id,
    required this.role,
    required this.parts,
    this.toolSteps = const [],
    this.isStreaming = false,
  });

  String get textContent =>
      parts.where((p) => p.type == 'text').map((p) => p.text ?? '').join();

  ChatMessage copyWith({
    List<MessagePart>? parts,
    List<ToolStep>? toolSteps,
    bool? isStreaming,
  }) {
    return ChatMessage(
      id: id,
      role: role,
      parts: parts ?? this.parts,
      toolSteps: toolSteps ?? this.toolSteps,
      isStreaming: isStreaming ?? this.isStreaming,
    );
  }
}
