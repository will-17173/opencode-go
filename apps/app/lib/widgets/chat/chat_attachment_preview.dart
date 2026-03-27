import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:opencode_go/l10n/app_localizations.dart';

import '../../theme/app_spacing.dart';

class ChatAttachmentPreview extends StatelessWidget {
  final List<Map<String, dynamic>> pendingFiles;
  final void Function(int index) onRemove;

  const ChatAttachmentPreview({
    super.key,
    required this.pendingFiles,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final l10n = AppLocalizations.of(context)!;

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 4, 8, 8),
            child: Text(
              l10n.chatPendingAttachments,
              style: textTheme.labelLarge?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          SizedBox(
            height: 76,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: pendingFiles.length,
              itemBuilder: (context, i) {
                return Stack(
                  children: [
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 6),
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        image: DecorationImage(
                          image: MemoryImage(
                            base64Decode(
                              (pendingFiles[i]['url'] as String).split(',').last,
                            ),
                          ),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    Positioned(
                      top: 4,
                      right: 4,
                      child: IconButton.filledTonal(
                        onPressed: () => onRemove(i),
                        icon: const Icon(Icons.close, size: 14),
                        style: IconButton.styleFrom(
                          minimumSize: const Size(28, 28),
                          maximumSize: const Size(28, 28),
                          padding: EdgeInsets.zero,
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
