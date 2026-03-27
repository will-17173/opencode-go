import 'package:flutter/material.dart';
import 'package:opencode_go/l10n/app_localizations.dart';

import '../../theme/app_spacing.dart';

class ChatEmptyState extends StatelessWidget {
  const ChatEmptyState({super.key});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context)!;

    return Center(
      child: Padding(
        padding: AppSpacing.pagePadding,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.auto_awesome_outlined, size: 56, color: colorScheme.primary),
            const SizedBox(height: AppSpacing.lg),
            Text(l10n.chatEmptyTitle, style: textTheme.titleLarge),
            const SizedBox(height: AppSpacing.sm),
            Text(
              l10n.chatEmptyMessage,
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
