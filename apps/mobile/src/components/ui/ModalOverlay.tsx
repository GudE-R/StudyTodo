import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, BackHandler } from 'react-native';

interface ModalOverlayProps {
    visible: boolean;
    animationType?: 'none' | 'slide' | 'fade';
    children: React.ReactNode;
    onRequestClose?: () => void;
}

/**
 * Modal の代替コンポーネント。
 * ネイティブ Modal と異なり、別ウィンドウを作成しないため
 * AdBanner など親コンポーネントの要素が隠れない。
 */
export const ModalOverlay: React.FC<ModalOverlayProps> = ({
    visible,
    animationType = 'none',
    children,
    onRequestClose,
}) => {
    const anim = useRef(new Animated.Value(0)).current;
    const [isRendered, setIsRendered] = useState(visible);

    useEffect(() => {
        if (visible) {
            setIsRendered(true);
            anim.setValue(0);
            if (animationType === 'none') {
                anim.setValue(1);
            } else {
                Animated.timing(anim, {
                    toValue: 1,
                    duration: animationType === 'slide' ? 300 : 200,
                    useNativeDriver: true,
                }).start();
            }
        } else {
            if (isRendered) {
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start(() => setIsRendered(false));
            }
        }
    }, [visible]);

    useEffect(() => {
        if (!visible || !onRequestClose) return;
        const handler = BackHandler.addEventListener('hardwareBackPress', () => {
            onRequestClose();
            return true;
        });
        return () => handler.remove();
    }, [visible, onRequestClose]);

    if (!isRendered) return null;

    const animStyle =
        animationType === 'fade'
            ? { opacity: anim }
            : animationType === 'slide'
                ? {
                    transform: [
                        {
                            translateY: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [600, 0],
                            }),
                        },
                    ],
                }
                : {};

    return (
        <View style={styles.root} pointerEvents="box-none">
            <Animated.View style={[styles.container, animStyle]}>
                {children}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        elevation: 1000,
    },
    container: {
        flex: 1,
    },
});
