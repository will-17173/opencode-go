import 'package:flutter/material.dart';

import '../../theme/app_spacing.dart';

class AppSection extends StatelessWidget {
  final Widget child;
  final String? title;
  final String? description;

  const AppSection({
    super.key,
    required this.child,
    this.title,
    this.description,
  });

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Text(title!, style: textTheme.titleMedium),
          if (description != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              description!,
              style: textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.lg),
        ],
        child,
      ],
    );
  }
}
