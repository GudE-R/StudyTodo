import React from 'react';
// React Nativeの基本コンポーネントをインポート
// View: <div>のようなコンテナ
// Text: 文字を表示するコンポーネント
// TouchableOpacity: タップ可能なボタン（押すと少し透明になる）
// Modal: 画面最前面に表示されるウィンドウ
// StyleSheet: スタイル定義用
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView, FlatList, Image, Platform } from 'react-native';
import { ModalOverlay } from '../ui/ModalOverlay';

// アイコンライブラリからのインポート
import { X, Moon, Sun, Languages, ChevronRight, ArrowLeft, Layout, Bell, BookOpen, Leaf, Briefcase } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';


// アプリケーション固有の機能をインポート（カスタムフックなど）
import { useTheme, ThemeMode } from '../../providers/ThemeProvider'; // テーマ管理（ダークモード等）
import { useTranslation } from 'react-i18next'; // 多言語対応
import { ACCENT_PRESETS, AccentColor } from '@studytodo/shared';
import { Check } from 'lucide-react-native';
import { SUPPORTED_LANGUAGES } from '../../i18n/languages'; // サポート言語リスト
import { useLayout } from '../../providers/LayoutProvider';
import { useSettingsForm } from '../../hooks/useSettingsForm';
import { useJournalSettings } from '../../hooks/useJournal';

// Propsの型定義
// 親コンポーネントから受け取るデータの型を指定します
interface SettingsModalProps {
    visible: boolean; // モーダルの表示状態
    onClose: () => void; // モーダルを閉じるための関数
}


/**
 * 設定画面モーダルコンポーネント
 * アプリの各種設定（テーマ、言語、レイアウト、同期）を管理します。
 */
export const SettingsModal = ({ visible, onClose }: SettingsModalProps) => {
    // --- Custom Hooks (機能の呼び出し) ---

    // テーマ設定を取得（現在の色, ダークモード状態, モード設定関数）
    const { colors, isDark, themeMode, setThemeMode, accentColor, setAccentColor } = useTheme();

    // 翻訳機能を取得（t: テキスト取得関数, i18n: 言語切り替えオブジェクト）
    const { t, i18n } = useTranslation();
    const { layoutMode, setLayoutMode } = useLayout();

    // リマインダー設定フック
    const { reminderEnabled, reminderTime, showTimePicker, setShowTimePicker, toggleReminder, onTimeChange } = useSettingsForm();

    // ジャーナル設定
    const { settings: journalSettings, updateSettings: updateJournalSettings } = useJournalSettings();

    // --- State (状態管理) ---

    // 現在表示しているビューの切り替え ('main' | 'language' | 'layout')
    const [view, setView] = React.useState<'main' | 'language' | 'layout'>('main');

    // モーダルの開閉状態(visible)が変わった時に実行される処理
    // モーダルが閉じられたら、次回開く時のために表示を 'main' に戻しておく
    React.useEffect(() => {
        if (!visible) setView('main');
    }, [visible]);

    // --- Helper Functions (表示用ヘルパー関数) ---

    // テーマ選択ボタンを描画する関数
    const renderThemeOption = (label: string, icon: any, mode: ThemeMode) => {
        const selected = themeMode === mode; // 現在の選択状態を判定
        return (
            <TouchableOpacity
                style={[
                    styles.themeOption,
                    { borderColor: colors.border },
                    // 選択されている場合のみ、アクセントカラーと背景色を適用
                    selected && { borderColor: colors.primary, backgroundColor: colors.primaryLight }
                ]}
                onPress={() => setThemeMode(mode)}
            >
                {icon}
                <Text style={[styles.themeText, { color: selected ? colors.primary : colors.textSecondary }]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    // 現在選択されている言語のラベルを取得
    const currentLanguageLabel = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language)?.label || i18n.language;

    /**
     * メイン設定画面のレンダリング
     */
    const renderMainView = () => (
        <ScrollView contentContainerStyle={styles.content}>
            {/* --- 外観設定 (Appearance) --- */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.appearance', 'Appearance')}</Text>
            <View style={styles.themeRow}>
                {renderThemeOption(t('theme.light', 'Light'), <Sun size={20} color={themeMode === 'light' ? colors.primary : colors.icon} />, 'light')}
                {renderThemeOption(t('theme.dark', 'Dark'), <Moon size={20} color={themeMode === 'dark' ? colors.primary : colors.icon} />, 'dark')}
            </View>
            <View style={[styles.themeRow, { marginTop: 8 }]}>
                {renderThemeOption(t('theme.paperClassic', 'Classic'), <BookOpen size={20} color={themeMode === 'paper-classic' ? colors.primary : colors.icon} />, 'paper-classic')}
                {renderThemeOption(t('theme.paperWashi', 'Washi'), <Leaf size={20} color={themeMode === 'paper-washi' ? colors.primary : colors.icon} />, 'paper-washi')}
                {renderThemeOption(t('theme.paperPlanner', 'Planner'), <Briefcase size={20} color={themeMode === 'paper-planner' ? colors.primary : colors.icon} />, 'paper-planner')}
            </View>

            {/* --- アクセントカラー設定 --- */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 16 }]}>{t('settings.accentColor', 'Accent Color')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {(Object.keys(ACCENT_PRESETS) as AccentColor[]).map((color) => {
                    const preset = ACCENT_PRESETS[color];
                    const displayColor = isDark ? preset.dark.primary : preset.light.primary;
                    const selected = accentColor === color;
                    return (
                        <TouchableOpacity
                            key={color}
                            onPress={() => setAccentColor(color)}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: displayColor,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: selected ? 3 : 0,
                                borderColor: isDark ? '#ffffff60' : '#00000030',
                                transform: [{ scale: selected ? 1.15 : 1 }],
                            }}
                        >
                            {selected && <Check size={16} color="#fff" />}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* --- 言語設定 (Language) --- */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>{t('settings.language', 'Language')}</Text>
            <TouchableOpacity
                style={[styles.menuItem, { borderColor: colors.border }]}
                onPress={() => setView('language')} // 言語選択画面へ切り替え
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Languages size={20} color={colors.textSecondary} />
                    <Text style={[styles.menuItemText, { color: colors.text }]}>{currentLanguageLabel}</Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* --- レイアウト設定 (Layout) --- */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>{t('settings.layout', 'Layout')}</Text>
            <TouchableOpacity
                style={[styles.menuItem, { borderColor: colors.border }]}
                onPress={() => setView('layout')} // レイアウト選択画面へ切り替え
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Layout size={20} color={colors.textSecondary} />
                    <Text style={[styles.menuItemText, { color: colors.text }]}>
                        {layoutMode === 'simple' ? t('settings.layoutSimple', 'Layout 1') : t('settings.layoutDefault', 'Layout 2')}
                    </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* --- 通知設定 (Notification) --- */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>{t('settings.notification', 'Notification')}</Text>
            <View style={[styles.menuItem, { borderColor: colors.border, flexDirection: 'column', alignItems: 'flex-start' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Bell size={20} color={colors.textSecondary} />
                        <Text style={[styles.menuItemText, { color: colors.text }]}>{t('settings.dailyReminder', 'Daily Reminder')}</Text>
                    </View>
                    <Switch
                        value={reminderEnabled}
                        onValueChange={toggleReminder}
                        trackColor={{ true: colors.primary }}
                    />
                </View>

                {reminderEnabled && (
                    <View style={{ marginTop: 15, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: colors.textSecondary }}>{t('settings.reminderTime', 'Daily at')}</Text>
                        {Platform.OS === 'android' ? (
                            <TouchableOpacity
                                onPress={() => setShowTimePicker(true)}
                                style={{ padding: 8, backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderRadius: 8 }}
                            >
                                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                                    {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <DateTimePicker
                                value={reminderTime}
                                mode="time"
                                display="default"
                                onChange={onTimeChange}
                                themeVariant={isDark ? 'dark' : 'light'}
                                style={{ width: 100 }}
                            />
                        )}
                    </View>
                )}

                {Platform.OS === 'android' && showTimePicker && (
                    <DateTimePicker
                        value={reminderTime}
                        mode="time"
                        display="default"
                        onChange={onTimeChange}
                    />
                )}
            </View>

            {/* --- ジャーナル設定 --- */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>{t('journal.settings', 'Journal')}</Text>
            <View style={[styles.menuItem, { borderColor: colors.border, flexDirection: 'column', alignItems: 'flex-start' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Text style={[styles.menuItemText, { color: colors.text, marginStart: 0 }]}>{t('journal.enabled', 'Journal Feature')}</Text>
                    <Switch
                        value={journalSettings.enabled}
                        onValueChange={(v) => updateJournalSettings({ enabled: v })}
                        trackColor={{ true: colors.primary }}
                    />
                </View>
                {journalSettings.enabled && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 12 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t('journal.autoPrompt', 'Prompt on task completion')}</Text>
                        <Switch
                            value={journalSettings.autoPromptOnComplete}
                            onValueChange={(v) => updateJournalSettings({ autoPromptOnComplete: v })}
                            trackColor={{ true: colors.primary }}
                        />
                    </View>
                )}
            </View>

            {/* --- クラウド同期（Proプラン予定） --- */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>{t('settings.cloudSync', 'Cloud Sync')}</Text>
            <View style={[styles.proInfo, { backgroundColor: isDark ? '#1e3a8a15' : '#eff6ff', borderColor: isDark ? '#1e3a8a40' : '#bfdbfe' }]}>
                <Text style={[styles.proInfoTitle, { color: colors.primary }]}>{t('settings.proComingSoon', 'Coming in Pro Plan')}</Text>
                <Text style={[styles.proInfoText, { color: colors.textSecondary }]}>
                    {t('settings.proDescription', 'Cloud sync and multi-device support will be available in the upcoming Pro plan. Your data is safely stored on this device.')}
                </Text>
            </View>

            {/* ガイドセクション (現在非表示) */}
            {/* <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>{t('settings.guide', 'About App')}</Text>
            <TouchableOpacity style={[styles.guideBtn, { borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <BookOpen size={20} color={colors.textSecondary} />
                    <Text style={[styles.guideText, { color: colors.text }]}>{t('guide.title', 'Usage Guide')}</Text>
                </View>
            </TouchableOpacity> */}
        </ScrollView >
    );

    /**
     * 言語選択画面のレンダリング
     */
    const renderLanguageView = () => (
        <View style={styles.languageContainer}>
            {/* 戻るボタン */}
            <TouchableOpacity style={[styles.backRow, { borderBottomColor: colors.border }]} onPress={() => setView('main')}>
                <ArrowLeft size={24} color={colors.text} />
                <Text style={[styles.backText, { color: colors.text }]}>{t('common.back', 'Back')}</Text>
            </TouchableOpacity>
            {/* 言語リストの表示 */}
            <FlatList
                data={SUPPORTED_LANGUAGES}
                keyExtractor={item => item.code}
                renderItem={({ item }) => {
                    const isSelected = item.code === i18n.language || (i18n.language === 'en-US' && item.code === 'en');

                    return (
                        <TouchableOpacity
                            style={[
                                styles.languageItem,
                                { borderBottomColor: colors.border },
                                isSelected && { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }
                            ]}
                            onPress={() => {
                                i18n.changeLanguage(item.code); // 言語を変更
                            }}
                        >
                            <Text style={[
                                styles.languageLabel,
                                { color: colors.text },
                                isSelected && { color: colors.primary, fontWeight: 'bold' }
                            ]}>
                                {item.label}
                            </Text>
                            {isSelected && <View style={[styles.checkMark, { backgroundColor: colors.primary }]} />}
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );

    // レイアウト選択の一時状態（保存ボタンで確定）
    const [selectedLayout, setSelectedLayout] = React.useState(layoutMode);

    // モーダルが開くたびに、現在のアクティブなレイアウトを初期値としてセット
    React.useEffect(() => {
        if (visible) setSelectedLayout(layoutMode);
    }, [visible, layoutMode]);

    /**
     * レイアウト選択画面のレンダリング
     */
    const renderLayoutView = () => (
        <View style={styles.languageContainer}>
            {/* 戻るボタン */}
            <TouchableOpacity style={[styles.backRow, { borderBottomColor: colors.border }]} onPress={() => setView('main')}>
                <ArrowLeft size={24} color={colors.text} />
                <Text style={[styles.backText, { color: colors.text }]}>{t('common.back', 'Back')}</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* プレビュー表示エリア (一時選択中のレイアウトを表示) */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.layoutPreview', 'Preview')}</Text>

                <View style={[styles.previewContainer, { borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
                    <LayoutPreview mode={selectedLayout} isDark={isDark} color={colors.primary} />
                </View>

                {/* 選択肢表示 */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>{t('settings.select', 'Select')}</Text>

                {/* Simple Option (Layout 1) */}
                <TouchableOpacity
                    style={[
                        styles.languageItem,
                        { borderBottomColor: colors.border },
                        selectedLayout === 'simple' && { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }
                    ]}
                    onPress={() => setSelectedLayout('simple')}
                >
                    <Text style={[
                        styles.languageLabel,
                        { color: colors.text },
                        selectedLayout === 'simple' && { color: colors.primary, fontWeight: 'bold' }
                    ]}>
                        {t('settings.layoutSimple', 'Layout 1')}
                    </Text>
                    {selectedLayout === 'simple' && <View style={[styles.checkMark, { backgroundColor: colors.primary }]} />}
                </TouchableOpacity>

                {/* Default Option (Layout 2) */}
                <TouchableOpacity
                    style={[
                        styles.languageItem,
                        { borderBottomColor: colors.border },
                        selectedLayout === 'default' && { backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff' }
                    ]}
                    onPress={() => setSelectedLayout('default')}
                >
                    <Text style={[
                        styles.languageLabel,
                        { color: colors.text },
                        selectedLayout === 'default' && { color: colors.primary, fontWeight: 'bold' }
                    ]}>
                        {t('settings.layoutDefault', 'Layout 2')}
                    </Text>
                    {selectedLayout === 'default' && <View style={[styles.checkMark, { backgroundColor: colors.primary }]} />}
                </TouchableOpacity>
            </ScrollView>

        </View>
    );


    // --- Main Render (最終的なモーダル全体の描画) ---
    return (
        <ModalOverlay visible={visible} animationType="slide">
            <View style={styles.overlay}>
                {/* 背景部分 */}
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* モーダルヘッダー */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        {/* 画面の状態(view)に応じてタイトルを切り替え */}
                        <Text style={[styles.title, { color: colors.text }]}>
                            {view === 'language' ? t('settings.language', 'Language') :
                                view === 'layout' ? t('settings.layout', 'Layout') :
                                    t('settings.title', 'Settings')}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {view === 'layout' && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setLayoutMode(selectedLayout);
                                        setView('main');
                                    }}
                                    disabled={selectedLayout === layoutMode}
                                    style={{ padding: 5, marginEnd: 15, opacity: selectedLayout === layoutMode ? 0.3 : 1 }}
                                >
                                    <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>{t('common.save', 'Save')}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* コンテンツの条件別レンダリング */}
                    {view === 'main' ? renderMainView() :
                        view === 'layout' ? renderLayoutView() :
                            renderLanguageView()}
                </View>
            </View>

        </ModalOverlay>
    );
};

// --- Sub Components (サブコンポーネント) ---

// レイアウトプレビュー用の簡易表示コンポーネント
// レイアウトプレビュー用の簡易表示コンポーネント
const LayoutPreview = ({ mode, isDark, color }: { mode: string, isDark: boolean, color: string }) => {
    let imageSource;

    if (mode === 'simple') {
        imageSource = require('../../../assets/previews/layout_simple.png');
    } else {
        imageSource = require('../../../assets/previews/layout_default.png');
    }

    return (
        <View style={styles.schematicContainer}>
            <Image
                source={imageSource}
                style={styles.previewImage}
                resizeMode="contain"
            />
        </View>
    );
};

// --- Styles (スタイル定義) ---
// CSSライクなスタイル定義
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        borderRadius: 15,
        overflow: 'hidden',
        maxHeight: 600, // リスト表示のために少し高さを確保
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 5,
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    themeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    themeOption: {
        flex: 1,
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
    },
    themeText: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: '500',
        color: '#64748b',
    },
    guideBtn: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 15,
    },
    guideText: {
        marginStart: 10,
        fontWeight: '500',
    },
    proInfo: {
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
    },
    proInfoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    proInfoText: {
        fontSize: 12,
        lineHeight: 18,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderWidth: 1,
        borderRadius: 10,
    },
    menuItemText: {
        marginStart: 10,
        fontSize: 16,
    },
    languageContainer: {
        flex: 1,
    },
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
    },
    backText: {
        marginStart: 10,
        fontSize: 16,
        fontWeight: '600',
    },
    languageItem: {
        padding: 15,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    languageLabel: {
        fontSize: 16,
    },
    checkMark: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    // Preview Styles
    previewContainer: {
        width: '100%',
        height: 260,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10
    },
    schematicContainer: {
        width: 120,
        height: 240,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        backgroundColor: '#fff'
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    saveBtn: {
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
