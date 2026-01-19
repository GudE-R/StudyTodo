import { Todo, Category, SRSProfile, Session } from "../types";

export interface StorageInterface {
    // Todos
    /** Todo一覧を取得します */
    getTodos(): Promise<Todo[]>;
    /** 指定されたIDのTodoを取得します */
    getTodo(id: string): Promise<Todo | undefined>;
    /** 新しいTodoを作成します */
    addTodo(todo: Todo): Promise<void>;
    /** 既存のTodoを更新します */
    updateTodo(id: string, updates: Partial<Todo>): Promise<void>;
    /** 指定されたIDのTodoを削除します */
    deleteTodo(id: string): Promise<void>;

    // Categories
    /** カテゴリ一覧を取得します */
    getCategories(): Promise<Category[]>;
    /** 新しいカテゴリを作成します */
    addCategory(category: Category): Promise<void>;
    /** 既存のカテゴリを更新します */
    updateCategory(id: string, updates: Partial<Category>): Promise<void>;
    /** 指定されたIDのカテゴリを削除します */
    deleteCategory(id: string): Promise<void>;

    // SRS Profiles
    /** SRSプロファイル一覧を取得します */
    getSRSProfiles(): Promise<SRSProfile[]>;
    /** 新しいSRSプロファイルを作成します */
    addSRSProfile(profile: SRSProfile): Promise<void>;
    /** 既存のSRSプロファイルを更新します */
    updateSRSProfile(id: string, updates: Partial<SRSProfile>): Promise<void>;
    /** 指定されたIDのSRSプロファイルを削除します */
    deleteSRSProfile(id: string): Promise<void>;

    // Sessions
    /** 学習セッションを記録します */
    addSession(session: Session): Promise<void>;
    /** 学習セッションの履歴を取得します */
    getSessions(): Promise<Session[]>;
    /** データ変更時のコールバックを登録します (リアルタイム同期用) - 解除関数を返す */
    onDataChange?(callback: (table: string, type: 'INSERT' | 'UPDATE' | 'DELETE', data: any) => void): () => void;

    // Feedback
    /** フィードバックを保存します */
    addFeedback(feedback: any): Promise<void>;
}
