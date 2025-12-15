# 05. 全体アーキテクチャ

```mermaid
graph TD
  subgraph Client[クライアント]
    W[Web (Next.js)]
    M[Mobile (Expo RN)]
  end

  subgraph Local[ローカル永続化]
    IDB[IndexedDB]
    SQLITE[SQLite]
  end

  subgraph Remote[バックエンド/SaaS]
    SUPA[Supabase (Auth/DB/RLS/Edge)]
    ADS[AdMob]
    PAY[IAP/Stripe]
  end

  W-->IDB
  M-->SQLITE
  IDB<-.- Sync[差分同期（Pro）] -.->SUPA
  SQLITE<-.- Sync -.->SUPA
  W-->ADS
  M-->ADS
  W-->PAY
  M-->PAY
```

補足
- すべての操作はローカルDBで完結します。Proのみ差分同期を有効化します。
- 認証/DB/定期実行はSupabaseに集約、広告はAdMob、課金はIAP/Stripeを使用します。

