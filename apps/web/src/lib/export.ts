import { db } from "@/lib/db";
import { format } from "date-fns";

/**
 * ファイルをダウンロードさせるヘルパー関数
 */
const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * 全データをJSONとしてエクスポート (バックアップ用途)
 */
export const exportToJson = async () => {
    try {
        const todos = await db.todos.toArray();
        const sessions = await db.sessions.toArray();
        const categories = await db.categories.toArray();
        const srsProfiles = await db.srsProfiles.toArray();

        const data = {
            version: 1,
            exportedAt: new Date().toISOString(),
            todos,
            sessions,
            categories,
            srsProfiles,
        };

        const fileName = `pomarc_backup_${format(new Date(), "yyyyMMdd_HHmm")}.json`;
        downloadFile(JSON.stringify(data, null, 2), fileName, "application/json");
        return true;
    } catch (error) {
        console.error("Failed to export JSON:", error);
        return false;
    }
};

/**
 * 学習セッションをCSVとしてエクスポート (分析用途)
 */
export const exportSessionsToCsv = async () => {
    try {
        const sessions = await db.sessions.orderBy("createdAt").reverse().toArray();

        // ヘッダー
        const header = ["SessionID", "TodoTitle", "Mode", "CreatedAt", "Duration(sec)", "TodoID"];

        // 行データ作成
        const rows = sessions.map((s) => [
            s.id,
            `"${s.todoTitle || ""}"`, // カンマを含む可能性があるのでクォート
            s.mode,
            format(new Date(s.createdAt), "yyyy-MM-dd HH:mm:ss"),
            s.duration,
            s.todoId
        ]);

        const csvContent = [
            header.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const fileName = `pomarc_sessions_${format(new Date(), "yyyyMMdd")}.csv`;
        // UTF-8 BOMを追加してExcelでの文字化けを防ぐ
        const bom = "\uFEFF";
        downloadFile(bom + csvContent, fileName, "text/csv");
        return true;
    } catch (error) {
        console.error("Failed to export CSV:", error);
        return false;
    }
};
