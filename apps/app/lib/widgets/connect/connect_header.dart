import 'package:flutter/material.dart';

import '../../theme/app_spacing.dart';

class ConnectHeader extends StatelessWidget {
  const ConnectHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      children: [
        CircleAvatar(
          radius: 38,
          backgroundColor: colorScheme.primaryContainer,
          child: Icon(Icons.hub_outlined, size: 38, color: colorScheme.primary),
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(
          'OpenCode Go',
          style: textTheme.headlineMedium,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          '把手机接入桌面端 OpenCode，继续你的工作区会话、历史记录和流式响应。',
          style: textTheme.bodyMedium?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
