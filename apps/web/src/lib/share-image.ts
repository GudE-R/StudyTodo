import { toBlob, toPng } from 'html-to-image';

export const generateAndCopyImage = async (node: HTMLElement): Promise<boolean> => {
    try {
        const blob = await toBlob(node, { cacheBust: true, pixelRatio: 2 });
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

export const downloadImage = async (node: HTMLElement, fileName: string = 'pomarc-stats.png') => {
    try {
        const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
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
