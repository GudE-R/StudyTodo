import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Script from "next/script";
import { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Web App Metadata Configuration (Triggered build for domain update)
const seoData: Record<string, { title: string; description: string }> = {
  ja: {
    title: "StudyTodo - ポモドーロタイマー＆学習管理アプリ",
    description: "効率的な学習をサポートするポモドーロタイマーとSRS（間隔反復システム）アプリ。タスク管理、スケジュール管理、学習記録を一元化。",
  },
  en: {
    title: "StudyTodo - Pomodoro Timer & Study Tracker",
    description: "Boost your productivity with Pomodoro timer and SRS (Spaced Repetition System). Manage tasks, schedules, and track your learning progress.",
  },
  de: {
    title: "StudyTodo - Pomodoro-Timer & Lernmanagement",
    description: "Steigern Sie Ihre Produktivität mit Pomodoro-Timer und SRS. Aufgaben-, Zeitplan- und Lernfortschrittsverwaltung.",
  },
  fr: {
    title: "StudyTodo - Minuteur Pomodoro & Suivi d'Études",
    description: "Boostez votre productivité avec le minuteur Pomodoro et le système SRS. Gestion des tâches, planification et suivi de progression.",
  },
  es: {
    title: "StudyTodo - Temporizador Pomodoro & Gestión de Estudios",
    description: "Mejora tu productividad con el temporizador Pomodoro y SRS. Gestión de tareas, horarios y seguimiento de aprendizaje.",
  },
  ko: {
    title: "StudyTodo - 포모도로 타이머 & 학습 관리",
    description: "포모도로 타이머와 SRS로 생산성을 높이세요. 작업 관리, 일정 관리, 학습 진도 추적을 한 곳에서.",
  },
  "zh-CN": {
    title: "StudyTodo - 番茄钟计时器 & 学习管理",
    description: "使用番茄钟和SRS间隔重复系统提高学习效率。任务管理、日程安排、学习进度追踪一站式解决。",
  },
  "zh-TW": {
    title: "StudyTodo - 番茄鐘計時器 & 學習管理",
    description: "使用番茄鐘和SRS間隔重複系統提升學習效率。任務管理、行程規劃、學習進度追蹤。",
  },
  "pt-BR": {
    title: "StudyTodo - Timer Pomodoro & Gerenciamento de Estudos",
    description: "Aumente sua produtividade com o timer Pomodoro e SRS. Gerencie tarefas, cronogramas e acompanhe seu progresso.",
  },
  it: {
    title: "StudyTodo - Timer Pomodoro & Gestione Studio",
    description: "Aumenta la tua produttività con il timer Pomodoro e SRS. Gestione attività, pianificazione e monitoraggio progressi.",
  },
  ru: {
    title: "StudyTodo - Помодоро таймер и управление обучением",
    description: "Повысьте продуктивность с помощью таймера Помодоро и SRS. Управление задачами, расписанием и отслеживание прогресса.",
  },
  vi: {
    title: "StudyTodo - Hẹn giờ Pomodoro & Quản lý học tập",
    description: "Tăng năng suất với hẹn giờ Pomodoro và SRS. Quản lý công việc, lịch trình và theo dõi tiến độ học tập.",
  },
  id: {
    title: "StudyTodo - Timer Pomodoro & Manajemen Belajar",
    description: "Tingkatkan produktivitas dengan timer Pomodoro dan SRS. Kelola tugas, jadwal, dan lacak kemajuan belajar.",
  },
  tr: {
    title: "StudyTodo - Pomodoro Zamanlayıcı & Çalışma Yönetimi",
    description: "Pomodoro zamanlayıcı ve SRS ile verimliliğinizi artırın. Görev, program ve ilerleme takibi.",
  },
  nl: {
    title: "StudyTodo - Pomodoro Timer & Studiebeheer",
    description: "Verhoog je productiviteit met Pomodoro timer en SRS. Beheer taken, schema's en volg je voortgang.",
  },
  sv: {
    title: "StudyTodo - Pomodoro-timer & Studiehantering",
    description: "Öka din produktivitet med Pomodoro-timer och SRS. Hantera uppgifter, scheman och spåra dina framsteg.",
  },
  no: {
    title: "StudyTodo - Pomodoro-timer & Studieadministrasjon",
    description: "Øk produktiviteten din med Pomodoro-timer og SRS. Administrer oppgaver, tidsplaner og spor fremgangen din.",
  },
  da: {
    title: "StudyTodo - Pomodoro-timer & Studieadministration",
    description: "Øg din produktivitet med Pomodoro-timer og SRS. Administrer opgaver, tidsplaner og spor din fremgang.",
  },
  fi: {
    title: "StudyTodo - Pomodoro-ajastin & Opiskelun hallinta",
    description: "Paranna tuottavuuttasi Pomodoro-ajastimella ja SRS:llä. Hallitse tehtäviä, aikatauluja ja seuraa edistymistäsi.",
  },
};

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://studytodo.app';

// 動的メタデータ生成
export async function generateMetadata(
  props: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await props.params;
  const seo = seoData[locale] || seoData.ja;

  // hreflang用の代替言語リンク
  const languages: Record<string, string> = {};
  routing.locales.forEach((loc) => {
    languages[loc] = `${baseUrl}/${loc}`;
  });

  return {
    title: seo.title,
    description: seo.description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `${baseUrl}/${locale}`,
      siteName: "StudyTodo",
      locale: locale.replace("-", "_"),
      type: "website",
      images: [
        {
          url: `${baseUrl}/${locale}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: seo.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [`${baseUrl}/${locale}/opengraph-image`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    manifest: "/manifest.json",
    icons: {
      icon: "/favicon.ico",
    },
    keywords: locale === "ja"
      ? ["ポモドーロ", "タイマー", "学習管理", "SRS", "間隔反復", "タスク管理", "生産性"]
      : ["pomodoro", "timer", "study", "SRS", "spaced repetition", "task management", "productivity"],
  };
}

// 構造化データ (JSON-LD)
function generateJsonLd(locale: string) {
  const seo = seoData[locale] || seoData.ja;
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "StudyTodo",
    description: seo.description,
    url: `${baseUrl}/${locale}`,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "StudyTodo Team",
    },
    inLanguage: locale,
  };
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const { children } = props;

  // 提供されたロケールが有効であることを確認
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  // サーバー側でメッセージを取得
  const messages = await getMessages();
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang={locale} dir={['ar', 'ur', 'fa', 'he'].includes(locale) ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        {/* 構造化データ (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateJsonLd(locale)),
          }}
        />
        {adsenseClientId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        {gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaMeasurementId}');`}
            </Script>
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
