import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// next-intl は訳の無いキーを英語で補うが、英語にも無いとキー名がそのまま画面に出る。
// コードで使っている翻訳キーが en.json と ja.json の両方にあることを確かめる。
const SRC_DIR = path.resolve(__dirname, "../..");
const LOCALES_DIR = path.resolve(__dirname, "../../../../../packages/shared/src/i18n/locales");

// const t = useTranslations("ns") / await getTranslations({ namespace: "ns" }) の形を拾う
const DECLARATION = /const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:["']([\w.]+)["']|\{[^}]*namespace:\s*["']([\w.]+)["'][^}]*\})?\s*\)/g;

function collectSourceFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return entry.name === "__tests__" ? [] : collectSourceFiles(fullPath);
        return /\.tsx?$/.test(entry.name) && !entry.name.includes(".test.") ? [fullPath] : [];
    });
}

// 固定文字列で呼んでいるキーだけを集める（`accent${...}` のような動的キーは対象外）
function collectUsedKeys(): Map<string, string> {
    const used = new Map<string, string>();
    for (const file of collectSourceFiles(SRC_DIR)) {
        const source = fs.readFileSync(file, "utf-8");
        for (const [, translator, namespace, optionNamespace] of source.matchAll(DECLARATION)) {
            const ns = namespace ?? optionNamespace;
            const call = new RegExp(`\\b${translator}(?:\\.rich|\\.raw|\\.markup|\\.has)?\\(\\s*(["'\`])([^"'\`$]*)\\1`, "g");
            for (const [, , key] of source.matchAll(call)) {
                used.set(ns ? `${ns}.${key}` : key, path.relative(SRC_DIR, file));
            }
        }
    }
    return used;
}

function hasKey(messages: Record<string, unknown>, key: string): boolean {
    let current: unknown = messages;
    for (const part of key.split(".")) {
        if (typeof current !== "object" || current === null || !(part in current)) return false;
        current = (current as Record<string, unknown>)[part];
    }
    return true;
}

const loadMessages = (locale: string): Record<string, unknown> =>
    JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${locale}.json`), "utf-8"));

describe("翻訳キー", () => {
    const used = collectUsedKeys();

    it("コードで使っている翻訳キーを集められている", () => {
        // 正規表現が壊れて 0 件になり、下のテストが素通りするのを防ぐ
        expect(used.size).toBeGreaterThan(100);
    });

    it.each(["en", "ja"])("%s.json に、コードで使っている翻訳キーがすべてある", (locale) => {
        const messages = loadMessages(locale);
        const missing = [...used].filter(([key]) => !hasKey(messages, key)).map(([key, file]) => `${key} (${file})`);
        expect(missing).toEqual([]);
    });
});
