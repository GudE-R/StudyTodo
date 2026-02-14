import { Category } from "@studytodo/shared";

/**
 * 指定されたカテゴリIDとそのすべての子孫カテゴリIDのセットを取得します。
 * @param categoryId 起点となるカテゴリID
 * @param categories カテゴリの全リスト（フラット）
 * @returns カテゴリIDのセット（起点を含む）
 */
export const getDescendantIds = (categoryId: string, categories: Category[]): Set<string> => {
    const descendants = new Set<string>();
    descendants.add(categoryId);

    // 再帰的に子孫を探す
    // フラットリストなので、parentIdが現在のセットに含まれるものを探すアプローチ
    // ただし、効率を考えると、親IDをキーとしたマップを作った方が良いが、
    // カテゴリ数は高々数十〜数百程度と想定されるため、単純な再帰探索で十分。

    const findChildren = (parentId: string) => {
        const children = categories.filter(c => c.parentId === parentId);
        children.forEach(child => {
            descendants.add(child.id);
            findChildren(child.id);
        });
    };

    findChildren(categoryId);
    return descendants;
};

/**
 * 対象のカテゴリが、フィルタカテゴリ（またはその子孫）に含まれるか判定します。
 * @param targetCategoryId 判定したいカテゴリID
 * @param filterCategoryId フィルタリングに使用しているカテゴリID
 * @param categories カテゴリの全リスト
 * @returns マッチする場合はtrue
 */
export const isCategoryMatch = (targetCategoryId: string | undefined, filterCategoryId: string, categories: Category[]): boolean => {
    if (filterCategoryId === 'all') return true;
    if (!targetCategoryId) return false; // カテゴリなしのタスクは'all'以外では表示しない想定（または要件による、「未分類」フィルタがあれば別）

    // ターゲットがフィルタIDそのものならtrue
    if (targetCategoryId === filterCategoryId) return true;

    // フィルタカテゴリの子孫IDセットを取得し、その中にターゲットが含まれるか確認
    // パフォーマンス最適化: 毎回計算するのは重いかもしれないが、
    // ActivityModal内ではuseMemoで計算済みのSetを使うのが望ましい。
    // ここでは単純なヘルパーとして提供。
    const descendantIds = getDescendantIds(filterCategoryId, categories);
    return descendantIds.has(targetCategoryId);
};

/**
 * フラットなカテゴリリストをツリー構造に変換します。
 * @param categories フラットなカテゴリリスト
 * @returns ツリー構造のカテゴリリスト（ルート要素の配列）
 */
export const buildCategoryTree = (categories: Category[]): Category[] => {
    // IDをキーにしたマップを作成
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    // 全てのカテゴリをマップに登録し、children配列を初期化
    categories.forEach(cat => {
        // オブジェクトのコピーを作成して変更を加える
        map.set(cat.id, { ...cat, children: [] });
    });

    // 親子関係を構築
    categories.forEach(cat => {
        const node = map.get(cat.id);
        if (!node) return;

        if (cat.parentId && map.has(cat.parentId)) {
            const parent = map.get(cat.parentId);
            parent!.children!.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
};
