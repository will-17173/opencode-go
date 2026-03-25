import 'dart:convert';

class SseEvent {
  final String? type;
  final String data;

  const SseEvent({this.type, required this.data});
}

Stream<SseEvent> parseSseStream(Stream<List<int>> byteStream) async* {
  // 使用字节缓冲区，避免在多字节字符边界（如中文）处截断导致乱码
  final byteBuffer = <int>[];

  await for (final chunk in byteStream) {
    byteBuffer.addAll(chunk);

    // 找最后一个完整的 \n\n（SSE 事件分隔符），只处理到此处
    int lastSep = -1;
    for (int i = byteBuffer.length - 2; i >= 0; i--) {
      if (byteBuffer[i] == 10 && byteBuffer[i + 1] == 10) {
        lastSep = i + 2;
        break;
      }
    }
    if (lastSep == -1) continue;

    final toProcess = byteBuffer.sublist(0, lastSep);
    byteBuffer.removeRange(0, lastSep);

    // UTF-8 解码，allowMalformed 防止异常
    final content = utf8.decode(toProcess, allowMalformed: true);
    final events = content.split('\n\n');

    for (final eventBlock in events) {
      if (eventBlock.trim().isEmpty) continue;
      String? eventType;
      final dataLines = <String>[];

      for (final line in eventBlock.split('\n')) {
        if (line.startsWith('event: ')) {
          eventType = line.substring(7).trim();
        } else if (line.startsWith('data: ')) {
          dataLines.add(line.substring(6));
        }
      }

      if (dataLines.isNotEmpty) {
        yield SseEvent(type: eventType, data: dataLines.join('\n'));
      }
    }
  }
}
