import 'package:flutter/material.dart';

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
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      maxLength: 6,
      onSubmitted: onSubmitted,
      decoration: const InputDecoration(
        labelText: '配对码',
        hintText: '6 位数字',
        prefixIcon: Icon(Icons.pin_outlined),
      ),
    );
  }
}
