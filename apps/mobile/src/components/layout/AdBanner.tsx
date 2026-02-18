import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// 開発環境ではテスト用IDを使用する
// 本番用IDは環境変数などで管理することを推奨します
const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx';

export const AdBanner = () => {
    const [error, setError] = useState<string | null>(null);

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Ad failed to load: {error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <BannerAd
                unitId={adUnitId}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                }}
                onAdFailedToLoad={(error) => {
                    console.error('Ad failed to load: ', error);
                    setError(error.message);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        // 高さ指定は削除し、広告サイズに合わせる
        width: '100%',
    },
    errorContainer: {
        height: 50,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    errorText: {
        color: '#888',
        fontSize: 12,
    }
});
