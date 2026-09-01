import React, { useEffect, useRef } from 'react';
import {
    Animated,
    BackHandler,
    Modal,
    Platform,
    StyleSheet,
} from 'react-native';
import { Portal } from 'react-native-paper';

/**
 * Modal ligero para formularios que deben abrirse sin esperar la creación
 * de una ventana nativa adicional en Android.
 */
export default function FastModal({
    visible,
    onDismiss,
    children,
    animation = 'fade',
}) {
    const opacity = useRef(new Animated.Value(0)).current;
    const offset = useRef(new Animated.Value(animation === 'slide' ? 18 : 0)).current;
    const scale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (!visible) {
            opacity.stopAnimation();
            offset.stopAnimation();
            scale.stopAnimation();
            return undefined;
        }

        opacity.setValue(0);
        offset.setValue(animation === 'slide' ? 18 : 0);
        scale.setValue(0.9);

        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 120,
                useNativeDriver: true,
            }),
            Animated.timing(offset, {
                toValue: 0,
                duration: 135,
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 1,
                duration: 135,
                useNativeDriver: true,
            }),
        ]).start();

        return () => {
            opacity.stopAnimation();
            offset.stopAnimation();
            scale.stopAnimation();
        };
    }, [animation, offset, opacity, scale, visible]);

    useEffect(() => {
        if (Platform.OS !== 'android' || !visible) return undefined;

        const subscription = BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                onDismiss?.();
                return true;
            },
        );

        return () => subscription.remove();
    }, [onDismiss, visible]);

    if (!visible) return null;

    const animatedStyle = {
        opacity,
        transform: animation === 'slide' ? [{ translateY: offset }] : [{ scale }],
    };

    const content = (
        <Animated.View style={[styles.animatedHost, animatedStyle]}>
            {children}
        </Animated.View>
    );

    if (Platform.OS === 'android') {
        return <Portal><Animated.View style={styles.androidHost}>{content}</Animated.View></Portal>;
    }

    return (
        <Modal
            visible
            transparent
            animationType="none"
            onRequestClose={onDismiss}
        >
            {content}
        </Modal>
    );
}

const styles = StyleSheet.create({
    androidHost: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 999,
        elevation: 999,
    },
    animatedHost: {
        flex: 1,
    },
});
