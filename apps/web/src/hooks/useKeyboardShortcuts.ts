import { useEffect } from "react";

interface ShortcutHandlers {
    onNewTodo?: () => void;
    onToggleTimer?: () => void;
    onCloseModal?: () => void;
    onStartFocus?: () => void;
}

/**
 * キーボードショートカットを管理するカスタムフック
 * 
 * @param handlers 各アクションに対応するハンドラ関数
 */
export function useKeyboardShortcuts({
    onNewTodo,
    onToggleTimer,
    onCloseModal,
    onStartFocus,
}: ShortcutHandlers) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // 入力フィールド等にフォーカスがある場合は無視
            const target = event.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            switch (event.code) {
                case "KeyN":
                    if (onNewTodo) {
                        event.preventDefault();
                        onNewTodo();
                    }
                    break;

                case "KeyP":
                case "Space":
                    if (onToggleTimer) {
                        event.preventDefault(); // スクロール防止 (Space)
                        onToggleTimer();
                    }
                    break;

                case "Escape":
                    if (onCloseModal) {
                        event.preventDefault();
                        onCloseModal();
                    }
                    break;

                case "Enter":
                    if (onStartFocus) {
                        // Enterは誤爆しやすいので、Ctrl/Metaとの組み合わせなどを検討しても良いが
                        // 一旦単体で実装し、呼び出し側で条件制御する
                        event.preventDefault();
                        onStartFocus();
                    }
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onNewTodo, onToggleTimer, onCloseModal, onStartFocus]);
}
