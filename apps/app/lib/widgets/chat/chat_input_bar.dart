import 'package:flutter/material.dart';
import 'package:opencode_go/l10n/app_localizations.dart';

class ChatInputBar extends StatelessWidget {
  final TextEditingController controller;
  final bool isLoading;
  final VoidCallback onPickImage;
  final VoidCallback onSend;
  final VoidCallback onStop;

  const ChatInputBar({
    super.key,
    required this.controller,
    required this.isLoading,
    required this.onPickImage,
    required this.onSend,
    required this.onStop,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;

    return Material(
      color: colorScheme.surfaceContainerLow,
      borderRadius: BorderRadius.circular(24),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            IconButton.filledTonal(
              icon: const Icon(Icons.image_outlined),
              onPressed: isLoading ? null : onPickImage,
              tooltip: l10n.chatAttachImage,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: controller,
                maxLines: 5,
                minLines: 1,
                textInputAction: TextInputAction.newline,
                decoration: InputDecoration(
                  hintText: l10n.chatPlaceholder,
                  filled: true,
                  fillColor: colorScheme.surface,
                ),
              ),
            ),
            const SizedBox(width: 8),
            isLoading
                ? IconButton.filledTonal(
                    icon: const Icon(Icons.stop),
                    onPressed: onStop,
                  )
                : IconButton.filled(
                    icon: const Icon(Icons.send),
                    onPressed: onSend,
                  ),
          ],
        ),
      ),
    );
  }
}
