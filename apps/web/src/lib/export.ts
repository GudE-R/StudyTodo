import { db } from "@/lib/db";
import { format } from "date-fns";

/**
 * 繝輔ぃ繧､繝ｫ繧偵ム繧ｦ繝ｳ繝ｭ繝ｼ繝峨＆縺帙ｋ繝倥Ν繝代・髢｢謨ｰ
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
 * 蜈ｨ繝・・繧ｿ繧谷SON縺ｨ縺励※繧ｨ繧ｯ繧ｹ繝昴・繝・(繝舌ャ繧ｯ繧｢繝・・逕ｨ騾・
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
 * 蟄ｦ鄙偵そ繝・す繝ｧ繝ｳ繧辰SV縺ｨ縺励※繧ｨ繧ｯ繧ｹ繝昴・繝・(蛻・梵逕ｨ騾・
 */
export const exportSessionsToCsv = async () => {
    try {
        const sessions = await db.sessions.orderBy("createdAt").reverse().toArray();

        // 繝倥ャ繝繝ｼ
        const header = ["SessionID", "TodoTitle", "Mode", "CreatedAt", "Duration(sec)", "TodoID"];

        // 陦後ョ繝ｼ繧ｿ菴懈・
        const rows = sessions.map((s) => [
            s.id,
            `"${s.todoTitle || ""}"`, // 繧ｫ繝ｳ繝槭ｒ蜷ｫ繧蜿ｯ閭ｽ諤ｧ縺後≠繧九・縺ｧ繧ｯ繧ｩ繝ｼ繝・
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
        // UTF-8 BOM繧定ｿｽ蜉縺励※Excel縺ｧ縺ｮ譁・ｭ怜喧縺代ｒ髦ｲ縺・
        const bom = "\uFEFF";
        downloadFile(bom + csvContent, fileName, "text/csv");
        return true;
    } catch (error) {
        console.error("Failed to export CSV:", error);
        return false;
    }
};
