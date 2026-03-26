import 'package:flutter/material.dart';

class ChatTypingOrStreamingIndicator extends StatelessWidget {
  const ChatTypingOrStreamingIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      width: 18,
      height: 18,
      child: CircularProgressIndicator(strokeWidth: 2),
    );
  }
}
