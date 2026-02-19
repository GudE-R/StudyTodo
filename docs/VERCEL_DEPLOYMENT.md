# Vercelデプロイガイド (StudyTodo)

StudyTodoのWebアプリはモノレポ構成（npm workspaces）を採用しているため、Vercelへのデプロイ時はリポジトリのルートディレクトリから実行する必要があります。

## 1. 事前準備 (環境変数)

Vercelのプロジェクト設定（Environment Variables）で以下の変数を設定してください：

| Key | Value (例) | 説明 |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_BASE_URL` | `https://studytodo.app` | アプリのベースURL（OGP画像生成などに使用） |
| `NEXT_PUBLIC_SUPABASE_URL` | (取得したURL) | SupabaseのAPI URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (取得したキー) | SupabaseのAnon Key |

## 2. デプロイ手順

ターミナルでリポジトリの **ルートディレクトリ** に移動し、以下のコマンドを実行します。

```bash
# プロダクションデプロイ
npx vercel --prod
```

> [!IMPORTANT]
> `apps/web` ディレクトリから `npx vercel` を実行すると、共有パッケージ (`packages/shared`) が見つからずビルドに失敗します。必ずルートから実行してください。

## 3. 設定の仕組み (`vercel.json`)

ルートディレクトリの `vercel.json` で以下の設定を行っています：
- **framework**: `nextjs`
- **installCommand**: `npm install` (ルートで実行され、全ワークスペースの依存関係を解決)
- **buildCommand**: `npm run build -w @studytodo/web` (Webアプリのみをビルド)

## 4. トラブルシューティング

### "Access token expired or revoked" エラー
リモートでの `npm install` 時にこのエラーが出る場合、以下の原因が考えられます：
1. **キャッシュの不整合**: Vercelダッシュボードの 「Deployments」→「Redeploy」から **"Redeploy without cache"** を試してください。
2. **Node.jsバージョンの不一致**: `package.json` の `engines` フィールドで `node: 20.x` を指定しています。Vercel側もこれに合わせるように設定されています。

### "Module not found: @studytodo/shared"
このエラーは、Vercelの「Root Directory」設定が `apps/web` になっている場合に発生します。
- Vercelのプロジェクト設定で **Root Directory を空（リポジトリルート）** にするか、
- `apps/web` をRootとする場合は、**"Include source files outside of the Root Directory in the Build Step"** をオンにする必要があります。
