class Session {
  final String id;
  final String title;
  final String directory;
  final DateTime? updatedAt;

  const Session({
    required this.id,
    required this.title,
    required this.directory,
    this.updatedAt,
  });

  factory Session.fromJson(Map<String, dynamic> json) {
    return Session(
      id: json['id'] as String,
      title: (json['title'] as String?) ?? '未命名会话',
      directory: (json['directory'] as String?) ?? '',
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String)
          : null,
    );
  }
}
