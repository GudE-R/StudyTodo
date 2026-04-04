import { readFileSync } from "fs";
import jwt from "jsonwebtoken";
const { sign } = jwt;

// ── 設定 ──
const ISSUER_ID = "ea539c79-f9bb-4c45-838b-574451483713";
const KEY_ID = "ZGA3UZ26CK";
const P8_PATH = "/home/tatsuya/ダウンロード/AuthKey_ZGA3UZ26CK.p8";
const APP_ID = "6759635529";

// ── マークダウンのロケールコード → App Store Connect のロケールコード ──
const LOCALE_MAP = {
  "ja": "ja",
  "en-US": "en-US",
  "ko": "ko",
  "zh-Hans": "zh-Hans",
  "zh-Hant": "zh-Hant",
  "fr-FR": "fr-FR",
  "de-DE": "de-DE",
  "es-ES": "es-ES",
  "es-MX": "es-MX",
  "pt-BR": "pt-BR",
  "ru": "ru",
  "it": "it",
  "nl-NL": "nl-NL",
  "nl": "nl-NL",
  "sv": "sv",
  "no": "no",
  "da": "da",
  "fi": "fi",
  "tr": "tr",
  "id": "id",
  "vi": "vi",
  "th": "th",
  "pl": "pl",
  "ro": "ro",
  "cs": "cs",
  "el": "el",
  "hu": "hu",
  "uk": "uk",
  "hi": "hi",
  "ar-SA": "ar-SA",
  "ar": "ar-SA",
  "he": "he",
  "ms": "ms",
  "ca": "ca",
  "hr": "hr",
  "sk": "sk",
  "sl": "sl",
  "fr-CA": "fr-CA",
};

// ── JWT 生成 ──
function generateToken() {
  const privateKey = readFileSync(P8_PATH, "utf8");
  const now = Math.floor(Date.now() / 1000);
  return sign({}, privateKey, {
    algorithm: "ES256",
    expiresIn: "20m",
    issuer: ISSUER_ID,
    audience: "appstoreconnect-v1",
    header: {
      alg: "ES256",
      kid: KEY_ID,
      typ: "JWT",
    },
  });
}

// ── API リクエスト ──
async function api(method, path, body) {
  const token = generateToken();
  const res = await fetch(`https://api.appstoreconnect.apple.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

// ── ページネーション対応 GET ──
async function apiGetAll(path) {
  let allData = [];
  let url = path;
  while (url) {
    const result = await api("GET", url);
    allData = allData.concat(result.data || []);
    const next = result.links?.next;
    if (next) {
      url = next.replace("https://api.appstoreconnect.apple.com/v1", "");
    } else {
      url = null;
    }
  }
  return allData;
}

// ── 30文字以内に最適化済みサブタイトル ──
const SUBTITLES = {
  "ja": "ポモドーロ×SRS×タスク 学習オールインワン",
  "en-US": "Pomodoro Timer & Study Planner",
  "ko": "뽀모도로·SRS·할일 학습 올인원",
  "zh-Hans": "番茄钟·SRS·任务 学习一站式",
  "zh-Hant": "番茄鐘·SRS·任務 學習一站式",
  "fr-FR": "Timer Pomodoro & Planificateur",
  "de-DE": "Pomodoro-Timer & Lernplaner",
  "es-ES": "Pomodoro y Planificador",
  "es-MX": "Pomodoro y Planificador",
  "pt-BR": "Timer Pomodoro & Planejador",
  "ru": "Помодоро-таймер и планировщик",
  "it": "Pomodoro & Pianificatore",
  "nl-NL": "Pomodoro-timer & Studyplanner",
  "sv": "Pomodoro & Studieplanerare",
  "no": "Pomodoro-timer & Studieplan",
  "da": "Pomodoro & Studieplanlægger",
  "fi": "Pomodoro & Opiskelusuunnitelma",
  "tr": "Pomodoro & Çalışma Planlayıcı",
  "id": "Timer Pomodoro & Perencana",
  "vi": "Pomodoro & Kế hoạch học tập",
  "th": "โปโมโดโร & แพลนเนอร์การเรียน",
  "pl": "Pomodoro & Planer nauki",
  "ro": "Pomodoro & Planificator studiu",
  "cs": "Pomodoro & Plánovač studia",
  "el": "Pomodoro & Σχεδιαστής μελέτης",
  "hu": "Pomodoro & Tanulástervező",
  "uk": "Помодоро-таймер і планувальник",
  "hi": "पोमोडोरो और अध्ययन प्लानर",
  "ar-SA": "بومودورو ومخطط الدراسة",
  "he": "פומודורו ומתכנן למידה",
  "ms": "Pomodoro & Perancang Belajar",
  "ca": "Pomodoro i Planificador",
  "hr": "Pomodoro & Planer učenja",
  "sk": "Pomodoro & Plánovač štúdia",
  "sl-SI": "Pomodoro & Načrtovalec učenja",
  "fr-CA": "Pomodoro & Planificateur",
};

// ── メイン処理 ──
async function main() {
  const mode = process.argv[2]; // "check" or undefined (= update)

  console.log("1. アプリの状態を確認中...\n");

  // appInfos の状態確認
  const appInfos = await apiGetAll(`/apps/${APP_ID}/appInfos`);
  console.log(`   appInfos (${appInfos.length}件):`);
  for (const info of appInfos) {
    console.log(`   - ID: ${info.id}, state: ${info.attributes?.appStoreState}`);
  }

  // appStoreVersions の状態確認
  const versions = await apiGetAll(`/apps/${APP_ID}/appStoreVersions`);
  console.log(`\n   appStoreVersions (${versions.length}件):`);
  for (const v of versions) {
    console.log(`   - ID: ${v.id}, version: ${v.attributes?.versionString}, state: ${v.attributes?.appStoreState}`);
  }

  if (mode === "check") return;

  // 編集可能なバージョン（PREPARE_FOR_SUBMISSION など）を探す
  const editableVersion = versions.find((v) =>
    ["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED"].includes(
      v.attributes?.appStoreState
    )
  );

  if (!editableVersion) {
    // 新しいバージョンを作成して編集可能にする
    const currentVersion = versions[0]?.attributes?.versionString || "1.0.24";
    const parts = currentVersion.split(".");
    parts[2] = String(Number(parts[2]) + 1);
    const newVersion = parts.join(".");
    console.log(`\n   編集可能なバージョンがないため、v${newVersion} を作成します...`);

    const created = await api("POST", "/appStoreVersions", {
      data: {
        type: "appStoreVersions",
        attributes: {
          versionString: newVersion,
          platform: "IOS",
        },
        relationships: {
          app: {
            data: { type: "apps", id: APP_ID },
          },
        },
      },
    });
    console.log(`   ✅ v${newVersion} を作成しました (ID: ${created.data.id})`);
  } else {
    console.log(`\n   編集可能なバージョンあり: ${editableVersion.id} (${editableVersion.attributes?.versionString})`);
  }

  // appInfos を再取得（新バージョン作成後は状態が変わっている可能性）
  const updatedAppInfos = await apiGetAll(`/apps/${APP_ID}/appInfos`);
  const targetAppInfo = updatedAppInfos.find(
    (i) => i.attributes?.appStoreState !== "READY_FOR_SALE"
  ) || updatedAppInfos[0];

  console.log(`   使用する appInfo: ${targetAppInfo.id} (${targetAppInfo.attributes?.appStoreState})\n`);

  console.log("2. サブタイトル一覧を準備中...");
  const subtitles = SUBTITLES;
  console.log(`   ${Object.keys(subtitles).length} 言語分のサブタイトルを取得\n`);

  console.log("3. 既存のローカリゼーションを取得中...");
  const localizations = await apiGetAll(
    `/appInfos/${targetAppInfo.id}/appInfoLocalizations`
  );
  const existingLocales = {};
  for (const loc of localizations) {
    existingLocales[loc.attributes.locale] = loc;
  }
  console.log(`   既存: ${Object.keys(existingLocales).join(", ")}\n`);

  console.log("4. サブタイトルを更新中...\n");
  let updated = 0;
  let created = 0;
  let skipped = 0;

  for (const [locale, subtitle] of Object.entries(subtitles)) {
    const existing = existingLocales[locale];
    if (existing) {
      try {
        await api("PATCH", `/appInfoLocalizations/${existing.id}`, {
          data: {
            type: "appInfoLocalizations",
            id: existing.id,
            attributes: { subtitle },
          },
        });
        console.log(`   ✅ 更新: ${locale} → ${subtitle}`);
        updated++;
      } catch (e) {
        console.log(`   ❌ 更新失敗: ${locale} → ${e.message}`);
      }
    } else {
      try {
        await api("POST", `/appInfoLocalizations`, {
          data: {
            type: "appInfoLocalizations",
            attributes: { locale, subtitle, name: "StudyTodo" },
            relationships: {
              appInfo: {
                data: { type: "appInfos", id: targetAppInfo.id },
              },
            },
          },
        });
        console.log(`   ✅ 新規作成: ${locale} → ${subtitle}`);
        created++;
      } catch (e) {
        console.log(`   ❌ 作成失敗: ${locale} → ${e.message}`);
        skipped++;
      }
    }
  }

  console.log(`\n完了: 更新=${updated}, 新規=${created}, スキップ=${skipped}`);
}

main().catch((e) => {
  console.error("エラー:", e.message);
  process.exit(1);
});
