import { readFileSync } from "fs";
import jwt from "jsonwebtoken";
const { sign } = jwt;

const ISSUER_ID = "ea539c79-f9bb-4c45-838b-574451483713";
const KEY_ID = "ZGA3UZ26CK";
const P8_PATH = "/home/tatsuya/ダウンロード/AuthKey_ZGA3UZ26CK.p8";
const VERSION_ID = "3b370337-72fc-4d84-be5b-84e40ba7c81b";

const WHATS_NEW = {
  "ja": "多言語対応を強化しました。アプリのサブタイトルが各言語で表示されるようになりました。",
  "en-US": "Improved multilingual support. App subtitle now displays in your language.",
  "en-GB": "Improved multilingual support. App subtitle now displays in your language.",
  "en-CA": "Improved multilingual support. App subtitle now displays in your language.",
  "en-AU": "Improved multilingual support. App subtitle now displays in your language.",
  "ko": "다국어 지원이 강화되었습니다. 앱 부제목이 각 언어로 표시됩니다.",
  "zh-Hans": "增强了多语言支持。应用副标题现在以您的语言显示。",
  "zh-Hant": "增強了多語言支援。應用程式副標題現在以您的語言顯示。",
  "fr-FR": "Amélioration du support multilingue. Le sous-titre de l'app s'affiche désormais dans votre langue.",
  "fr-CA": "Amélioration du support multilingue. Le sous-titre de l'app s'affiche désormais dans votre langue.",
  "de-DE": "Verbesserte Mehrsprachigkeit. Der App-Untertitel wird jetzt in Ihrer Sprache angezeigt.",
  "es-ES": "Mejora del soporte multilingüe. El subtítulo de la app ahora se muestra en tu idioma.",
  "es-MX": "Mejora del soporte multilingüe. El subtítulo de la app ahora se muestra en tu idioma.",
  "pt-BR": "Suporte multilíngue aprimorado. O subtítulo do app agora aparece no seu idioma.",
  "pt-PT": "Suporte multilíngue melhorado. O subtítulo da app agora aparece no seu idioma.",
  "ru": "Улучшена многоязычная поддержка. Подзаголовок приложения теперь отображается на вашем языке.",
  "it": "Migliorato il supporto multilingue. Il sottotitolo dell'app ora viene visualizzato nella tua lingua.",
  "nl-NL": "Meertalige ondersteuning verbeterd. De ondertitel van de app wordt nu in uw taal weergegeven.",
  "sv": "Förbättrat flerspråkigt stöd. Appens underrubrik visas nu på ditt språk.",
  "no": "Forbedret flerspråklig støtte. Appens undertittel vises nå på ditt språk.",
  "da": "Forbedret flersproget understøttelse. Appens undertitel vises nu på dit sprog.",
  "fi": "Monikielinen tuki parannettu. Sovelluksen alaotsikko näkyy nyt omalla kielelläsi.",
  "tr": "Çok dilli destek iyileştirildi. Uygulama alt başlığı artık kendi dilinizde görüntüleniyor.",
  "id": "Dukungan multibahasa ditingkatkan. Subjudul aplikasi kini ditampilkan dalam bahasa Anda.",
  "vi": "Cải thiện hỗ trợ đa ngôn ngữ. Phụ đề ứng dụng hiện hiển thị bằng ngôn ngữ của bạn.",
  "th": "ปรับปรุงการรองรับหลายภาษา ชื่อรองของแอปแสดงในภาษาของคุณแล้ว",
  "pl": "Ulepszono obsługę wielu języków. Podtytuł aplikacji wyświetla się teraz w Twoim języku.",
  "ro": "Suport multilingv îmbunătățit. Subtitlul aplicației este acum afișat în limba dvs.",
  "cs": "Vylepšena vícejazyčná podpora. Podtitulek aplikace se nyní zobrazuje ve vašem jazyce.",
  "el": "Βελτιωμένη πολυγλωσσική υποστήριξη. Ο υπότιτλος της εφαρμογής εμφανίζεται τώρα στη γλώσσα σας.",
  "hu": "Továbbfejlesztett többnyelvű támogatás. Az alkalmazás alcíme most az Ön nyelvén jelenik meg.",
  "uk": "Покращено багатомовну підтримку. Підзаголовок додатка тепер відображається вашою мовою.",
  "hi": "बहुभाषी समर्थन में सुधार किया गया। ऐप उपशीर्षक अब आपकी भाषा में प्रदर्शित होता है।",
  "ar-SA": "تحسين دعم اللغات المتعددة. يظهر العنوان الفرعي للتطبيق الآن بلغتك.",
  "he": "שיפור תמיכה רב-לשונית. כותרת המשנה של האפליקציה מוצגת כעת בשפה שלך.",
  "ms": "Sokongan berbilang bahasa dipertingkat. Sari kata aplikasi kini dipaparkan dalam bahasa anda.",
  "ca": "Millora del suport multilingüe. El subtítol de l'app ara es mostra en el vostre idioma.",
  "hr": "Poboljšana višejezična podrška. Podnaslov aplikacije sada se prikazuje na vašem jeziku.",
  "sk": "Vylepšená viacjazyčná podpora. Podnadpis aplikácie sa teraz zobrazuje vo vašom jazyku.",
  "sl-SI": "Izboljšana večjezična podpora. Podnaslov aplikacije je zdaj prikazan v vašem jeziku.",
  "bn-BD": "বহুভাষিক সমর্থন উন্নত করা হয়েছে। অ্যাপের সাবটাইটেল এখন আপনার ভাষায় প্রদর্শিত হয়।",
  "mr-IN": "बहुभाषिक समर्थन सुधारले. अॅप उपशीर्षक आता तुमच्या भाषेत प्रदर्शित होते.",
  "ta-IN": "பல மொழி ஆதரவு மேம்படுத்தப்பட்டது. ஆப் துணைத்தலைப்பு இப்போது உங்கள் மொழியில் காட்டப்படும்.",
  "te-IN": "బహుభాషా మద్దతు మెరుగుపరచబడింది. యాప్ ఉపశీర్షిక ఇప్పుడు మీ భాషలో ప్రదర్శించబడుతుంది.",
  "gu-IN": "બહુભાષી સમર્થન સુધારવામાં આવ્યું. એપ સબટાઈટલ હવે તમારી ભાષામાં દેખાય છે.",
  "kn-IN": "ಬಹುಭಾಷಾ ಬೆಂಬಲ ಸುಧಾರಿಸಲಾಗಿದೆ. ಅಪ್ಲಿಕೇಶನ್ ಉಪಶೀರ್ಷಿಕೆ ಈಗ ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಪ್ರದರ್ಶಿಸಲಾಗುತ್ತದೆ.",
  "ml-IN": "ബഹുഭാഷാ പിന്തുണ മെച്ചപ്പെടുത്തി. ആപ്പ് ഉപശീർഷകം ഇപ്പോൾ നിങ്ങളുടെ ഭാഷയിൽ പ്രദർശിപ്പിക്കുന്നു.",
  "pa-IN": "ਬਹੁ-ਭਾਸ਼ਾਈ ਸਮਰਥਨ ਵਿੱਚ ਸੁਧਾਰ ਕੀਤਾ ਗਿਆ। ਐਪ ਉਪਸਿਰਲੇਖ ਹੁਣ ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ ਦਿਖਾਈ ਦਿੰਦਾ ਹੈ।",
  "ur-PK": "کثیر لسانی معاونت بہتر بنائی گئی۔ ایپ سب ٹائٹل اب آپ کی زبان میں ظاہر ہوتا ہے۔",
  "or-IN": "ବହୁଭାଷିକ ସମର୍ଥନ ଉନ୍ନତ କରାଯାଇଛି। ଆପ୍ ସବଟାଇଟଲ୍ ବର୍ତ୍ତମାନ ଆପଣଙ୍କ ଭାଷାରେ ପ୍ରଦର୍ଶିତ ହେଉଛି।",
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

async function main() {
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
