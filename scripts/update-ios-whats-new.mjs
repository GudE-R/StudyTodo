import { readFileSync } from "fs";
import jwt from "jsonwebtoken";
const { sign } = jwt;

const ISSUER_ID = "ea539c79-f9bb-4c45-838b-574451483713";
const KEY_ID = "ZGA3UZ26CK";
const P8_PATH = "/home/tatsuya/ダウンロード/AuthKey_ZGA3UZ26CK.p8";
const APP_ID = "6759635529";
const VERSION_STRING = process.env.APP_VERSION || "1.0.26";

const WHATS_NEW = {
  "ja": "安定性の向上と細かな改善を行いました。",
  "en-US": "Stability improvements and minor refinements.",
  "en-GB": "Stability improvements and minor refinements.",
  "en-CA": "Stability improvements and minor refinements.",
  "en-AU": "Stability improvements and minor refinements.",
  "ko": "안정성을 개선하고 세부 사항을 다듬었습니다.",
  "zh-Hans": "提升了稳定性并进行了细节改进。",
  "zh-Hant": "提升了穩定性並進行了細節改進。",
  "fr-FR": "Améliorations de la stabilité et ajustements mineurs.",
  "fr-CA": "Améliorations de la stabilité et ajustements mineurs.",
  "de-DE": "Stabilitätsverbesserungen und kleinere Anpassungen.",
  "es-ES": "Mejoras de estabilidad y ajustes menores.",
  "es-MX": "Mejoras de estabilidad y ajustes menores.",
  "pt-BR": "Melhorias de estabilidade e pequenos ajustes.",
  "pt-PT": "Melhorias de estabilidade e pequenos ajustes.",
  "ru": "Улучшена стабильность и внесены мелкие доработки.",
  "it": "Miglioramenti di stabilità e piccole rifiniture.",
  "nl-NL": "Stabiliteitsverbeteringen en kleine aanpassingen.",
  "sv": "Stabilitetsförbättringar och mindre justeringar.",
  "no": "Forbedret stabilitet og mindre justeringer.",
  "da": "Stabilitetsforbedringer og mindre justeringer.",
  "fi": "Vakautta parannettu ja pieniä hienosäätöjä tehty.",
  "tr": "Kararlılık iyileştirmeleri ve küçük düzenlemeler.",
  "id": "Peningkatan stabilitas dan penyempurnaan kecil.",
  "vi": "Cải thiện độ ổn định và các tinh chỉnh nhỏ.",
  "th": "ปรับปรุงเสถียรภาพและแก้ไขเล็กน้อย",
  "pl": "Poprawa stabilności i drobne udoskonalenia.",
  "ro": "Îmbunătățiri de stabilitate și ajustări minore.",
  "cs": "Vylepšení stability a drobné úpravy.",
  "el": "Βελτιώσεις σταθερότητας και μικρές διορθώσεις.",
  "hu": "Stabilitási fejlesztések és apróbb finomítások.",
  "uk": "Покращено стабільність і внесено незначні вдосконалення.",
  "hi": "स्थिरता में सुधार और छोटे परिशोधन।",
  "ar-SA": "تحسينات في الاستقرار وتعديلات طفيفة.",
  "he": "שיפורי יציבות ושיפורים קלים.",
  "ms": "Penambahbaikan kestabilan dan pelarasan kecil.",
  "ca": "Millores d'estabilitat i ajustos menors.",
  "hr": "Poboljšanja stabilnosti i manje prilagodbe.",
  "sk": "Vylepšenia stability a drobné úpravy.",
  "sl-SI": "Izboljšave stabilnosti in manjše prilagoditve.",
  "bn-BD": "স্থিতিশীলতার উন্নতি এবং ছোটখাটো পরিমার্জন।",
  "mr-IN": "स्थिरता सुधारणा आणि लहान परिष्करण.",
  "ta-IN": "நிலைத்தன்மை மேம்பாடுகள் மற்றும் சிறிய சீரமைப்புகள்.",
  "te-IN": "స్థిరత్వ మెరుగుదలలు మరియు చిన్న మెరుగులు.",
  "gu-IN": "સ્થિરતામાં સુધારો અને નાના ફેરફારો.",
  "kn-IN": "ಸ್ಥಿರತೆಯ ಸುಧಾರಣೆಗಳು ಮತ್ತು ಸಣ್ಣ ಪರಿಷ್ಕರಣೆಗಳು.",
  "ml-IN": "സ്ഥിരത മെച്ചപ്പെടുത്തലുകളും ചെറിയ പരിഷ്കരണങ്ങളും.",
  "pa-IN": "ਸਥਿਰਤਾ ਵਿੱਚ ਸੁਧਾਰ ਅਤੇ ਛੋਟੇ ਸੁਧਾਰ।",
  "ur-PK": "استحکام میں بہتری اور معمولی اصلاحات۔",
  "or-IN": "ସ୍ଥିରତା ଉନ୍ନତି ଏବଂ ଛୋଟ ସଜାଡ଼ିବା।",
};

function generateToken() {
  const privateKey = readFileSync(P8_PATH, "utf8");
  return sign({}, privateKey, {
    algorithm: "ES256",
    expiresIn: "20m",
    issuer: ISSUER_ID,
    audience: "appstoreconnect-v1",
    header: { alg: "ES256", kid: KEY_ID, typ: "JWT" },
  });
}

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
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function apiGetAll(path) {
  let allData = [], url = path;
  while (url) {
    const result = await api("GET", url);
    allData = allData.concat(result.data || []);
    const next = result.links?.next;
    url = next ? next.replace("https://api.appstoreconnect.apple.com/v1", "") : null;
  }
  return allData;
}

async function resolveVersionId() {
  const versions = await apiGetAll(`/apps/${APP_ID}/appStoreVersions?filter[versionString]=${VERSION_STRING}&limit=5`);
  const target = versions.find((v) => v.attributes?.versionString === VERSION_STRING);
  return target ? target.id : null;
}

async function findBuildId(versionString) {
  const builds = await apiGetAll(`/builds?filter[app]=${APP_ID}&filter[version]=${versionString}&limit=5`);
  const valid = builds.find((b) => b.attributes?.processingState === "VALID");
  if (!valid) throw new Error(`build ${versionString} が見つからないか処理中です`);
  return valid.id;
}

async function createVersion() {
  // 既存バージョンの属性を参考に新バージョンを作成
  const prev = await apiGetAll(`/apps/${APP_ID}/appStoreVersions?limit=10`);
  const copyright = prev.find((v) => v.attributes?.copyright)?.attributes?.copyright;
  const result = await api("POST", `/appStoreVersions`, {
    data: {
      type: "appStoreVersions",
      attributes: {
        platform: "IOS",
        versionString: VERSION_STRING,
        releaseType: "AFTER_APPROVAL",
        ...(copyright ? { copyright } : {}),
      },
      relationships: {
        app: { data: { type: "apps", id: APP_ID } },
      },
    },
  });
  return result.data.id;
}

async function attachBuild(versionId, buildId) {
  await api("PATCH", `/appStoreVersions/${versionId}/relationships/build`, {
    data: { type: "builds", id: buildId },
  });
}

async function main() {
  console.log(`0. バージョン ${VERSION_STRING} の VERSION_ID を取得中...`);
  let VERSION_ID = await resolveVersionId();
  if (!VERSION_ID) {
    console.log(`   → 未作成。新規作成します...`);
    VERSION_ID = await createVersion();
    console.log(`   → 作成: ${VERSION_ID}`);

    // buildNumber はアプリの buildNumber（1.0.27）。ビルドを紐付ける。
    const buildVersion = process.env.BUILD_NUMBER || "1.0.27";
    console.log(`   → build ${buildVersion} を紐付け中...`);
    const buildId = await findBuildId(buildVersion);
    await attachBuild(VERSION_ID, buildId);
    console.log(`   → build 紐付け完了: ${buildId}\n`);
  } else {
    console.log(`   → ${VERSION_ID}\n`);
  }

  console.log("1. バージョンのローカリゼーションを取得中...");
  const locs = await apiGetAll(`/appStoreVersions/${VERSION_ID}/appStoreVersionLocalizations`);
  const locMap = {};
  for (const loc of locs) locMap[loc.attributes.locale] = loc;
  console.log(`   ${locs.length} 件取得\n`);

  console.log("2. 「このバージョンの最新情報」を更新中...\n");
  let ok = 0, fail = 0;

  for (const [locale, whatsNew] of Object.entries(WHATS_NEW)) {
    const loc = locMap[locale];
    if (loc) {
      try {
        await api("PATCH", `/appStoreVersionLocalizations/${loc.id}`, {
          data: {
            type: "appStoreVersionLocalizations",
            id: loc.id,
            attributes: { whatsNew },
          },
        });
        console.log(`   ✅ ${locale}`);
        ok++;
      } catch (e) {
        console.log(`   ❌ ${locale}: ${e.message}`);
        fail++;
      }
    } else {
      console.log(`   ⚠ ${locale}: ローカリゼーション未作成`);
    }
  }

  console.log(`\n完了: 成功=${ok}, 失敗=${fail}`);
}

main().catch((e) => { console.error("エラー:", e.message); process.exit(1); });
