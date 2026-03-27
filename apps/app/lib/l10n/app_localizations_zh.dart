// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get appTitle => 'OpenCode Go';

  @override
  String get connectTitle => '连接配置';

  @override
  String get connectSubtitle => '把手机接入桌面端 OpenCode，继续你的工作区会话、历史记录和流式响应。';

  @override
  String get connectFormTitle => '连接设置';

  @override
  String get connectFormDesc => '输入桌面端 OpenCode 的主机信息与配对码。';

  @override
  String get connectLoadingConfig => '正在读取上次成功的连接配置';

  @override
  String get connectIpLabel => 'IP 地址';

  @override
  String get connectIpHint => '例如：192.168.1.100';

  @override
  String get connectPortLabel => '端口';

  @override
  String get connectPortHint => '38096';

  @override
  String get connectPairingCode => '配对码';

  @override
  String get connectPairingCodeHint => '6 位数字';

  @override
  String get connectButton => '连接到桌面端';

  @override
  String get connectErrorFailed => '连接失败，请检查 IP 和端口是否正确，以及 OpenCode Go 是否在运行';

  @override
  String get connectErrorCode => '配对码错误，请重新输入';

  @override
  String get connectErrorNetwork => '验证失败，请检查网络连接';

  @override
  String get homeTitle => '工作区';

  @override
  String get homeSubtitle => '选择桌面端已经开始使用的目录，查看历史会话或继续新的对话。';

  @override
  String get homeLoading => '正在同步桌面端的工作区列表';

  @override
  String get homeErrorPrefix => '目录加载失败：';

  @override
  String get homeEmptyTitle => '暂无工作区';

  @override
  String get homeEmptyMessage => '请先在 PC 端开始一个对话，随后这里会显示可继续的工作区。';

  @override
  String get sessionTitle => '历史会话';

  @override
  String get sessionLoading => '正在加载该目录下的历史会话';

  @override
  String get sessionErrorPrefix => '无法加载历史会话：';

  @override
  String get sessionEmptyTitle => '暂无历史会话';

  @override
  String get sessionEmptyMessage => '在这个工作区下还没有历史对话，点击右下角即可开始新的会话。';

  @override
  String get sessionNewChat => '新对话';

  @override
  String get sessionDeleteNotConnected => '当前未连接，无法删除会话';

  @override
  String get sessionDeleted => '会话已删除';

  @override
  String get sessionDeleteFailed => '删除会话失败';

  @override
  String get sessionPin => '置顶';

  @override
  String get sessionUnpin => '取消置顶';

  @override
  String get sessionDelete => '删除';

  @override
  String get sessionNoUpdateTime => '未记录更新时间';

  @override
  String get sessionToday => '今天 ';

  @override
  String get sessionYesterday => '昨天';

  @override
  String get chatDefaultTitle => '对话';

  @override
  String get chatPlaceholder => '发送消息...';

  @override
  String get chatSend => '发送';

  @override
  String get chatAttachImage => '添加图片';

  @override
  String get chatStop => '停止';

  @override
  String get chatLoading => '正在输入...';

  @override
  String get chatEmptyTitle => '开始新对话';

  @override
  String get chatEmptyMessage => '输入消息开始与 AI 对话';

  @override
  String get chatPendingAttachments => '待发送附件';

  @override
  String get chatToolCall => '工具调用';

  @override
  String get chatToolExecuting => '执行中';

  @override
  String get chatToolCompleted => '已完成';

  @override
  String get chatToolFailed => '执行失败';

  @override
  String get chatErrorPrefix => '请求失败：';

  @override
  String get settingsTitle => '设置';

  @override
  String get settingsLanguage => '语言';

  @override
  String get settingsLanguageSystem => '跟随系统';

  @override
  String get settingsLanguageZh => '中文';

  @override
  String get settingsLanguageEn => 'English';

  @override
  String get errorConnectionLost => '连接已断开';

  @override
  String get errorRetry => '重试';

  @override
  String get errorLoadFailed => '加载失败';

  @override
  String get commonLoading => '加载中...';

  @override
  String get commonUnnamedSession => '未命名会话';
}
