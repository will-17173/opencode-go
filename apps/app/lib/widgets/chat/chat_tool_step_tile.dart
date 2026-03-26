import 'package:flutter/material.dart';

import '../../models/message.dart';

class ChatToolStepTile extends StatelessWidget {
  final ToolStep step;

  const ChatToolStepTile({super.key, required this.step});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isRunning = step.status == 'running';
    final isError = step.status == 'error';

    final background = isError
        ? colorScheme.errorContainer
        : isRunning
            ? colorScheme.secondaryContainer
            : colorScheme.surfaceContainerHighest;

    final foreground = isError
        ? colorScheme.onErrorContainer
        : isRunning
            ? colorScheme.onSecondaryContainer
            : colorScheme.onSurfaceVariant;

    final label = isError
        ? '执行失败'
        : isRunning
            ? '执行中'
            : '已完成';

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: isRunning
                ? const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 1.75),
                  )
                : Icon(
                    isError ? Icons.error_outline : Icons.check_circle_outline,
                    size: 16,
                    color: foreground,
                  ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step.title,
                  style: textTheme.bodyMedium?.copyWith(
                    color: foreground,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: textTheme.bodySmall?.copyWith(
                    color: foreground.withValues(alpha: 0.85),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
