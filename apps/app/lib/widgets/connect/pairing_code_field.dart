import 'package:flutter/material.dart';
import 'package:opencode_go/l10n/app_localizations.dart';

class PairingCodeField extends StatelessWidget {
  final TextEditingController controller;
  final void Function(String)? onSubmitted;

  const PairingCodeField({
    super.key,
    required this.controller,
    this.onSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      maxLength: 6,
      onSubmitted: onSubmitted,
      decoration: InputDecoration(
        labelText: l10n.connectPairingCode,
        hintText: l10n.connectPairingCodeHint,
        prefixIcon: const Icon(Icons.pin_outlined),
      ),
    );
  }
}
