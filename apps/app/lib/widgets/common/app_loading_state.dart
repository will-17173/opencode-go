import 'package:flutter/material.dart';
import 'package:opencode_go/l10n/app_localizations.dart';

import '../../theme/app_spacing.dart';

class AppLoadingState extends StatelessWidget {
  final String? title;
  final String? message;

  const AppLoadingState({
    super.key,
    this.title,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 360),
        child: Card(
          color: colorScheme.surfaceContainerLow,
          child: Padding(
            padding: AppSpacing.cardContentPadding,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(
                  backgroundColor: colorScheme.surfaceContainerHighest,
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(title ?? l10n.commonLoading, style: textTheme.titleMedium),
                if (message != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    message!,
                    textAlign: TextAlign.center,
                    style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
