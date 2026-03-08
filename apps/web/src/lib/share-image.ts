import { toBlob, toPng } from 'html-to-image';

const imageOptions = {
    cacheBust: true,
    pixelRatio: 2,
    filter: (node: HTMLElement) => {
        // html-to-imageが不要なノードを除外しないようにする
        return true;
    },
};

// html-to-imageはフォントやSVGの読み込みタイミングで失敗することがあるためリトライする
const withRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await fn();
            return result;
        } catch (error) {
            if (i === retries - 1) throw error;
            // 次のリトライ前に少し待つ
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    throw new Error('Unreachable');
};

const ensureFontsLoaded = async () => {
    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
    }
};

export const generateAndCopyImage = async (node: HTMLElement): Promise<boolean> => {
    try {
        await ensureFontsLoaded();
        const blob = await withRetry(() => toBlob(node, imageOptions));
        if (!blob) throw new Error('Failed to create blob');

        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob,
            }),
        ]);
        return true;
    } catch (error) {
        console.error('Failed to copy image:', error);
        return false;
    }
};

export const downloadImage = async (node: HTMLElement, fileName: string = 'studytodo-stats.png') => {
    try {
        await ensureFontsLoaded();
        const dataUrl = await withRetry(() => toPng(node, imageOptions));
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
        return true;
    } catch (error) {
        console.error('Failed to download image:', error);
        return false;
    }
};
