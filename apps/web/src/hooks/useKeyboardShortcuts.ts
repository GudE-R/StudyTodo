import { useEffect } from "react";

interface ShortcutHandlers {
    onNewTodo?: () => void;
    onToggleTimer?: () => void;
    onCloseModal?: () => void;
    onStartFocus?: () => void;
}

/**
 * 繧ｭ繝ｼ繝懊・繝峨す繝ｧ繝ｼ繝医き繝・ヨ繧堤ｮ｡逅・☆繧九き繧ｹ繧ｿ繝繝輔ャ繧ｯ
 * 
 * @param handlers 蜷・い繧ｯ繧ｷ繝ｧ繝ｳ縺ｫ蟇ｾ蠢懊☆繧九ワ繝ｳ繝峨Λ髢｢謨ｰ
 */
export function useKeyboardShortcuts({
    onNewTodo,
    onToggleTimer,
    onCloseModal,
    onStartFocus,
}: ShortcutHandlers) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // 蜈･蜉帙ヵ繧｣繝ｼ繝ｫ繝臥ｭ峨↓繝輔か繝ｼ繧ｫ繧ｹ縺後≠繧句ｴ蜷医・辟｡隕・
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
                        event.preventDefault(); // 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ髦ｲ豁｢ (Space)
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
                        // Enter縺ｯ隱､辷・＠繧・☆縺・・縺ｧ縲，trl/Meta縺ｨ縺ｮ邨・∩蜷医ｏ縺帙↑縺ｩ繧呈､懆ｨ弱＠縺ｦ繧り憶縺・′
                        // 荳譌ｦ蜊倅ｽ薙〒螳溯｣・＠縲∝他縺ｳ蜃ｺ縺怜・縺ｧ譚｡莉ｶ蛻ｶ蠕｡縺吶ｋ
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
