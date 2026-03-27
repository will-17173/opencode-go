import 'package:flutter/material.dart';

class AppColorSchemes {
  // 与 Electron 桌面端保持一致的绿色主色 (#07a37e)
  static const Color seed = Color(0xFF07A37E);

  static final ColorScheme light = ColorScheme.fromSeed(
    seedColor: seed,
    brightness: Brightness.light,
  );
}
