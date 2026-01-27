import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'StudyTodo - Pomodoro Timer & Study Tracker';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

// 多言語タイトル
const titles: Record<string, { title: string; subtitle: string }> = {
    ja: { title: 'StudyTodo', subtitle: 'ポモドーロタイマー＆学習管理アプリ' },
    en: { title: 'StudyTodo', subtitle: 'Pomodoro Timer & Study Tracker' },
    de: { title: 'StudyTodo', subtitle: 'Pomodoro-Timer & Lernmanagement' },
    fr: { title: 'StudyTodo', subtitle: 'Minuteur Pomodoro & Suivi d\'Études' },
    es: { title: 'StudyTodo', subtitle: 'Temporizador Pomodoro & Gestión de Estudios' },
    ko: { title: 'StudyTodo', subtitle: '포모도로 타이머 & 학습 관리' },
    'zh-CN': { title: 'StudyTodo', subtitle: '番茄钟计时器 & 学习管理' },
    'zh-TW': { title: 'StudyTodo', subtitle: '番茄鐘計時器 & 學習管理' },
    'pt-BR': { title: 'StudyTodo', subtitle: 'Timer Pomodoro & Gerenciamento de Estudos' },
    it: { title: 'StudyTodo', subtitle: 'Timer Pomodoro & Gestione Studio' },
    ru: { title: 'StudyTodo', subtitle: 'Помодоро таймер и управление обучением' },
    vi: { title: 'StudyTodo', subtitle: 'Hẹn giờ Pomodoro & Quản lý học tập' },
    id: { title: 'StudyTodo', subtitle: 'Timer Pomodoro & Manajemen Belajar' },
    tr: { title: 'StudyTodo', subtitle: 'Pomodoro Zamanlayıcı & Çalışma Yönetimi' },
    nl: { title: 'StudyTodo', subtitle: 'Pomodoro Timer & Studiebeheer' },
    sv: { title: 'StudyTodo', subtitle: 'Pomodoro-timer & Studiehantering' },
    no: { title: 'StudyTodo', subtitle: 'Pomodoro-timer & Studieadministrasjon' },
    da: { title: 'StudyTodo', subtitle: 'Pomodoro-timer & Studieadministration' },
    fi: { title: 'StudyTodo', subtitle: 'Pomodoro-ajastin & Opiskelun hallinta' },
};

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const content = titles[locale] || titles.ja;

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontFamily: 'system-ui, sans-serif',
                }}
            >
                {/* Logo / Icon */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 120,
                        height: 120,
                        borderRadius: 24,
                        background: 'white',
                        marginBottom: 40,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                    }}
                >
                    <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#764ba2"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        {/* Timer icon */}
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                </div>

                {/* Title */}
                <div
                    style={{
                        display: 'flex',
                        fontSize: 72,
                        fontWeight: 800,
                        color: 'white',
                        marginBottom: 16,
                        textShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    }}
                >
                    {content.title}
                </div>

                {/* Subtitle */}
                <div
                    style={{
                        display: 'flex',
                        fontSize: 32,
                        color: 'rgba(255,255,255,0.9)',
                        textAlign: 'center',
                        maxWidth: 900,
                    }}
                >
                    {content.subtitle}
                </div>

                {/* Features */}
                <div
                    style={{
                        display: 'flex',
                        marginTop: 60,
                        gap: 40,
                    }}
                >
                    {['🍅 Pomodoro', '📚 SRS', '📊 Analytics'].map((feature) => (
                        <div
                            key={feature}
                            style={{
                                display: 'flex',
                                padding: '12px 24px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: 999,
                                fontSize: 24,
                                color: 'white',
                            }}
                        >
                            {feature}
                        </div>
                    ))}
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
