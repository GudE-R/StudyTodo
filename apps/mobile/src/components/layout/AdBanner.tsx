import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Expo Goかを判定
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const AdBanner = () => {
    const [BannerComponent, setBannerComponent] = useState<any>(null);
    const [adUnitId, setAdUnitId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isExpoGo) {
            // Expo Goでは何もしない（またはプレースホルダー表示）
            return;
        }

        const loadAdMob = async () => {
            try {
                // Dynamic import to avoid crash in Expo Go
                const { BannerAd, BannerAdSize, TestIds, mobileAds } = require('react-native-google-mobile-ads');
                const { Platform } = require('react-native');

                // Initialize AdMob
                await mobileAds().initialize();

                let id = TestIds.BANNER;

                if (!__DEV__) {
                    if (Platform.OS === 'android') {
                        id = Constants.expoConfig?.extra?.admobAndroidBannerId || TestIds.BANNER;
                    } else if (Platform.OS === 'ios') {
                        id = Constants.expoConfig?.extra?.admobIosBannerId || TestIds.BANNER;
                    }
                }

                setAdUnitId(id);
                setBannerComponent(() => {
                    // Return a component that renders the BannerAd
                    return (props: any) => (
                        <BannerAd
                            unitId={id}
                            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                            requestOptions={{
                                requestNonPersonalizedAdsOnly: true,
                            }}
                            onAdFailedToLoad={(error: any) => {
                                console.error('Ad failed to load: ', error);
                                props.onError(error.message);
                            }}
                        />
                    );
                });

            } catch (e) {
                console.warn('AdMob module not found or failed to load:', e);
                setError('AdMob not available');
            }
        };

        loadAdMob();
    }, []);

    if (isExpoGo) {
        return (
            <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>Ads are disabled in Expo Go</Text>
            </View>
        );
    }

    if (error) {
        return null; // エラー時は非表示（または開発用エラー表示）
    }

    if (!BannerComponent || !adUnitId) {
        return null; // ロード中
    }

    return (
        <View style={styles.container}>
            <BannerComponent onError={setError} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        zIndex: 2000,
        elevation: 2000,
    },
    placeholderContainer: {
        height: 50,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        borderBottomWidth: 1,
        borderColor: '#ccc',
        zIndex: 2000,
        elevation: 2000,
    },
    placeholderText: {
        color: '#666',
        fontSize: 12,
    }
});
