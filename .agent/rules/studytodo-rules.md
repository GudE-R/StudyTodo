---
trigger: always_on
---

チャットやアーティファクトの生成には必ず日本語を使用すること

コマンド実行時は cd を使わず、run_command の Cwd パラメータで作業ディレクトリを指定すること
（悪い例: cd /home/gude/Dev/StudyTodo && git status）
（良い例: Cwd="/home/gude/Dev/StudyTodo" CommandLine="git status"）


タスク完了時に以下のことを行ってください
03_IMPLEMENTATION.md 04_FUTURE.md 開発日記を編集
Gitへコミット＆プッシュ