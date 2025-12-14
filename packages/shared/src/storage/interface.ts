import { Todo, Category, SRSProfile, Session } from "../types";

export interface StorageInterface {
    // Todos
    getTodos(): Promise<Todo[]>;
    getTodo(id: string): Promise<Todo | undefined>;
    addTodo(todo: Todo): Promise<void>;
    updateTodo(id: string, updates: Partial<Todo>): Promise<void>;
    deleteTodo(id: string): Promise<void>;

    // Categories
    getCategories(): Promise<Category[]>;
    addCategory(category: Category): Promise<void>;
    updateCategory(id: string, updates: Partial<Category>): Promise<void>;
    deleteCategory(id: string): Promise<void>;

    // SRS Profiles
    getSRSProfiles(): Promise<SRSProfile[]>;
    addSRSProfile(profile: SRSProfile): Promise<void>;
    updateSRSProfile(id: string, updates: Partial<SRSProfile>): Promise<void>;
    deleteSRSProfile(id: string): Promise<void>;

    // Sessions
    addSession(session: Session): Promise<void>;
    getSessions(): Promise<Session[]>;
}
