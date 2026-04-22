import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const REVIEW_REQUESTED_KEY = 'HAS_REQUESTED_STORE_REVIEW';

export async function maybeRequestStoreReview(): Promise<void> {
    try {
        const alreadyRequested = await AsyncStorage.getItem(REVIEW_REQUESTED_KEY);
        if (alreadyRequested === '1') return;

        const available = await StoreReview.isAvailableAsync();
        if (!available) return;

        const hasAction = await StoreReview.hasAction();
        if (!hasAction) return;

        await StoreReview.requestReview();
        await AsyncStorage.setItem(REVIEW_REQUESTED_KEY, '1');
    } catch {
        // レビュー表示は最良努力（失敗してもユーザー操作を妨げない）
    }
}
