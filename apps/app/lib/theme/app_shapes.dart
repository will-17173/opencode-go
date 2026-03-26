import 'package:flutter/material.dart';

class AppShapes {
  static const double small = 12;
  static const double medium = 20;
  static const double large = 28;

  static RoundedRectangleBorder cardShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(large),
  );

  static RoundedRectangleBorder inputShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(medium),
  );

  static RoundedRectangleBorder buttonShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(medium),
  );
}
