import 'package:flutter/material.dart';

class AppStatusProvider extends ChangeNotifier {
  bool _online = true;

  bool get online => _online;

  void alternarConexao() {
    _online = !_online;
    notifyListeners();
  }
}
