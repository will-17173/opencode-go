import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

import '../../models/message.dart';
import 'chat_tool_step_tile.dart';
import 'chat_typing_or_streaming_indicator.dart';

class ChatMessagePartView extends StatelessWidget {
  final ChatMessage message;
  final bool isUser;

  const ChatMessagePartView({
    super.key,
    required this.message,
    required this.isUser,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    if (isUser) {
      return Text(
        message.textContent,
        style: TextStyle(color: colorScheme.onPrimaryContainer),
      );
    }

    if (message.isStreaming && message.textContent.isEmpty) {
      return const ChatTypingOrStreamingIndicator();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (message.toolSteps.isNotEmpty)
          ChatToolStepTile(step: message.toolSteps.last),
        MarkdownBody(
          data: message.textContent,
          selectable: true,
          styleSheet: MarkdownStyleSheet(
            p: TextStyle(color: colorScheme.onSurface, height: 1.5),
            code: TextStyle(
              backgroundColor: colorScheme.surfaceContainerHighest,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }
}
