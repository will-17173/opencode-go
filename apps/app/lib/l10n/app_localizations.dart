import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('zh'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In zh, this message translates to:
  /// **'OpenCode Go'**
  String get appTitle;

  /// No description provided for @connectTitle.
  ///
  /// In zh, this message translates to:
  /// **'连接配置'**
  String get connectTitle;

  /// No description provided for @connectSubtitle.
  ///
  /// In zh, this message translates to:
  /// **'把手机接入桌面端 OpenCode，继续你的工作区会话、历史记录和流式响应。'**
  String get connectSubtitle;

  /// No description provided for @connectFormTitle.
  ///
  /// In zh, this message translates to:
  /// **'连接设置'**
  String get connectFormTitle;

  /// No description provided for @connectFormDesc.
  ///
  /// In zh, this message translates to:
  /// **'输入桌面端 OpenCode 的主机信息与配对码。'**
  String get connectFormDesc;

  /// No description provided for @connectLoadingConfig.
  ///
  /// In zh, this message translates to:
  /// **'正在读取上次成功的连接配置'**
  String get connectLoadingConfig;

  /// No description provided for @connectIpLabel.
  ///
  /// In zh, this message translates to:
  /// **'IP 地址'**
  String get connectIpLabel;

  /// No description provided for @connectIpHint.
  ///
  /// In zh, this message translates to:
  /// **'例如：192.168.1.100'**
  String get connectIpHint;

  /// No description provided for @connectPortLabel.
  ///
  /// In zh, this message translates to:
  /// **'端口'**
  String get connectPortLabel;

  /// No description provided for @connectPortHint.
  ///
  /// In zh, this message translates to:
  /// **'38096'**
  String get connectPortHint;

  /// No description provided for @connectPairingCode.
  ///
  /// In zh, this message translates to:
  /// **'配对码'**
  String get connectPairingCode;

  /// No description provided for @connectPairingCodeHint.
  ///
  /// In zh, this message translates to:
  /// **'6 位数字'**
  String get connectPairingCodeHint;

  /// No description provided for @connectButton.
  ///
  /// In zh, this message translates to:
  /// **'连接到桌面端'**
  String get connectButton;

  /// No description provided for @connectErrorFailed.
  ///
  /// In zh, this message translates to:
  /// **'连接失败，请检查 IP 和端口是否正确，以及 OpenCode Go 是否在运行'**
  String get connectErrorFailed;

  /// No description provided for @connectErrorCode.
  ///
  /// In zh, this message translates to:
  /// **'配对码错误，请重新输入'**
  String get connectErrorCode;

  /// No description provided for @connectErrorNetwork.
  ///
  /// In zh, this message translates to:
  /// **'验证失败，请检查网络连接'**
  String get connectErrorNetwork;

  /// No description provided for @homeTitle.
  ///
  /// In zh, this message translates to:
  /// **'工作区'**
  String get homeTitle;

  /// No description provided for @homeSubtitle.
  ///
  /// In zh, this message translates to:
  /// **'选择桌面端已经开始使用的目录，查看历史会话或继续新的对话。'**
  String get homeSubtitle;

  /// No description provided for @homeLoading.
  ///
  /// In zh, this message translates to:
  /// **'正在同步桌面端的工作区列表'**
  String get homeLoading;

  /// No description provided for @homeErrorPrefix.
  ///
  /// In zh, this message translates to:
  /// **'目录加载失败：'**
  String get homeErrorPrefix;

  /// No description provided for @homeEmptyTitle.
  ///
  /// In zh, this message translates to:
  /// **'暂无工作区'**
  String get homeEmptyTitle;

  /// No description provided for @homeEmptyMessage.
  ///
  /// In zh, this message translates to:
  /// **'请先在 PC 端开始一个对话，随后这里会显示可继续的工作区。'**
  String get homeEmptyMessage;

  /// No description provided for @sessionTitle.
  ///
  /// In zh, this message translates to:
  /// **'历史会话'**
  String get sessionTitle;

  /// No description provided for @sessionLoading.
  ///
  /// In zh, this message translates to:
  /// **'正在加载该目录下的历史会话'**
  String get sessionLoading;

  /// No description provided for @sessionErrorPrefix.
  ///
  /// In zh, this message translates to:
  /// **'无法加载历史会话：'**
  String get sessionErrorPrefix;

  /// No description provided for @sessionEmptyTitle.
  ///
  /// In zh, this message translates to:
  /// **'暂无历史会话'**
  String get sessionEmptyTitle;

  /// No description provided for @sessionEmptyMessage.
  ///
  /// In zh, this message translates to:
  /// **'在这个工作区下还没有历史对话，点击右下角即可开始新的会话。'**
  String get sessionEmptyMessage;

  /// No description provided for @sessionNewChat.
  ///
  /// In zh, this message translates to:
  /// **'新对话'**
  String get sessionNewChat;

  /// No description provided for @sessionDeleteNotConnected.
  ///
  /// In zh, this message translates to:
  /// **'当前未连接，无法删除会话'**
  String get sessionDeleteNotConnected;

  /// No description provided for @sessionDeleted.
  ///
  /// In zh, this message translates to:
  /// **'会话已删除'**
  String get sessionDeleted;

  /// No description provided for @sessionDeleteFailed.
  ///
  /// In zh, this message translates to:
  /// **'删除会话失败'**
  String get sessionDeleteFailed;

  /// No description provided for @sessionPin.
  ///
  /// In zh, this message translates to:
  /// **'置顶'**
  String get sessionPin;

  /// No description provided for @sessionUnpin.
  ///
  /// In zh, this message translates to:
  /// **'取消置顶'**
  String get sessionUnpin;

  /// No description provided for @sessionDelete.
  ///
  /// In zh, this message translates to:
  /// **'删除'**
  String get sessionDelete;

  /// No description provided for @sessionNoUpdateTime.
  ///
  /// In zh, this message translates to:
  /// **'未记录更新时间'**
  String get sessionNoUpdateTime;

  /// No description provided for @sessionToday.
  ///
  /// In zh, this message translates to:
  /// **'今天 '**
  String get sessionToday;

  /// No description provided for @sessionYesterday.
  ///
  /// In zh, this message translates to:
  /// **'昨天'**
  String get sessionYesterday;

  /// No description provided for @chatDefaultTitle.
  ///
  /// In zh, this message translates to:
  /// **'对话'**
  String get chatDefaultTitle;

  /// No description provided for @chatPlaceholder.
  ///
  /// In zh, this message translates to:
  /// **'发送消息...'**
  String get chatPlaceholder;

  /// No description provided for @chatSend.
  ///
  /// In zh, this message translates to:
  /// **'发送'**
  String get chatSend;

  /// No description provided for @chatAttachImage.
  ///
  /// In zh, this message translates to:
  /// **'添加图片'**
  String get chatAttachImage;

  /// No description provided for @chatStop.
  ///
  /// In zh, this message translates to:
  /// **'停止'**
  String get chatStop;

  /// No description provided for @chatLoading.
  ///
  /// In zh, this message translates to:
  /// **'正在输入...'**
  String get chatLoading;

  /// No description provided for @chatEmptyTitle.
  ///
  /// In zh, this message translates to:
  /// **'开始新对话'**
  String get chatEmptyTitle;

  /// No description provided for @chatEmptyMessage.
  ///
  /// In zh, this message translates to:
  /// **'输入消息开始与 AI 对话'**
  String get chatEmptyMessage;

  /// No description provided for @chatPendingAttachments.
  ///
  /// In zh, this message translates to:
  /// **'待发送附件'**
  String get chatPendingAttachments;

  /// No description provided for @chatToolCall.
  ///
  /// In zh, this message translates to:
  /// **'工具调用'**
  String get chatToolCall;

  /// No description provided for @chatToolExecuting.
  ///
  /// In zh, this message translates to:
  /// **'执行中'**
  String get chatToolExecuting;

  /// No description provided for @chatToolCompleted.
  ///
  /// In zh, this message translates to:
  /// **'已完成'**
  String get chatToolCompleted;

  /// No description provided for @chatToolFailed.
  ///
  /// In zh, this message translates to:
  /// **'执行失败'**
  String get chatToolFailed;

  /// No description provided for @chatErrorPrefix.
  ///
  /// In zh, this message translates to:
  /// **'请求失败：'**
  String get chatErrorPrefix;

  /// No description provided for @settingsTitle.
  ///
  /// In zh, this message translates to:
  /// **'设置'**
  String get settingsTitle;

  /// No description provided for @settingsLanguage.
  ///
  /// In zh, this message translates to:
  /// **'语言'**
  String get settingsLanguage;

  /// No description provided for @settingsLanguageSystem.
  ///
  /// In zh, this message translates to:
  /// **'跟随系统'**
  String get settingsLanguageSystem;

  /// No description provided for @settingsLanguageZh.
  ///
  /// In zh, this message translates to:
  /// **'中文'**
  String get settingsLanguageZh;

  /// No description provided for @settingsLanguageEn.
  ///
  /// In zh, this message translates to:
  /// **'English'**
  String get settingsLanguageEn;

  /// No description provided for @errorConnectionLost.
  ///
  /// In zh, this message translates to:
  /// **'连接已断开'**
  String get errorConnectionLost;

  /// No description provided for @errorRetry.
  ///
  /// In zh, this message translates to:
  /// **'重试'**
  String get errorRetry;

  /// No description provided for @errorLoadFailed.
  ///
  /// In zh, this message translates to:
  /// **'加载失败'**
  String get errorLoadFailed;

  /// No description provided for @commonLoading.
  ///
  /// In zh, this message translates to:
  /// **'加载中...'**
  String get commonLoading;

  /// No description provided for @commonUnnamedSession.
  ///
  /// In zh, this message translates to:
  /// **'未命名会话'**
  String get commonUnnamedSession;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'zh'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'zh':
      return AppLocalizationsZh();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
