import 'package:flutter/material.dart';

import '../../theme/app_spacing.dart';

class ChatEmptyState extends StatelessWidget {
  const ChatEmptyState({super.key});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: AppSpacing.pagePadding,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.auto_awesome_outlined, size: 56, color: colorScheme.primary),
            const SizedBox(height: AppSpacing.lg),
            Text('开始一个新对话', style: textTheme.titleLarge),
            const SizedBox(height: AppSpacing.sm),
            Text(
              '发送消息或添加图片附件，OpenCode 会继续当前工作目录下的对话上下文。',
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
