import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:opencode_go/l10n/app_localizations.dart';
import 'package:opencode_go/providers/locale_provider.dart';

class LanguageSelector extends ConsumerWidget {
  const LanguageSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final l10n = AppLocalizations.of(context)!;

    return SegmentedButton<Locale?>(
      segments: [
        ButtonSegment(
          value: null,
          label: Text(l10n.settingsLanguageSystem),
        ),
        const ButtonSegment(
          value: Locale('zh'),
          label: Text('中文'),
        ),
        const ButtonSegment(
          value: Locale('en'),
          label: Text('English'),
        ),
      ],
      selected: {locale},
      onSelectionChanged: (set) {
        ref.read(localeProvider.notifier).setLocale(set.first);
      },
    );
  }
}