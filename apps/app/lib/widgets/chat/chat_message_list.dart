import 'package:flutter/material.dart';

import '../../models/message.dart';
import '../../theme/app_spacing.dart';
import 'chat_empty_state.dart';
import 'chat_message_bubble.dart';

class ChatMessageList extends StatelessWidget {
  final List<ChatMessage> messages;
  final ScrollController controller;

  const ChatMessageList({
    super.key,
    required this.messages,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    if (messages.isEmpty) {
      return const ChatEmptyState();
    }

    return ListView.builder(
      controller: controller,
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.lg,
        AppSpacing.md,
        AppSpacing.md,
      ),
      itemCount: messages.length,
      itemBuilder: (context, index) => ChatMessageBubble(message: messages[index]),
    );
  }
}
