import 'package:flutter/material.dart';
import 'package:opencode_go/l10n/app_localizations.dart';

import '../../theme/app_spacing.dart';
import '../common/app_section.dart';

class ConnectFormCard extends StatelessWidget {
  final List<Widget> children;

  const ConnectFormCard({
    super.key,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Card(
      child: Padding(
        padding: AppSpacing.cardContentPadding,
        child: AppSection(
          title: l10n.connectFormTitle,
          description: l10n.connectFormDesc,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: children,
          ),
        ),
      ),
    );
  }
}
