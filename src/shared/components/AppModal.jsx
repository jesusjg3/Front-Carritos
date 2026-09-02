import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    BackHandler,
    Easing,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
} from 'react-native';
import { Portal, useTheme } from 'react-native-paper';
import { MODAL_ANIMATION_MS } from '../../core/constants/timing';

/**
 * Modal común para la aplicación móvil.
 * El contenido permanece montado en React mientras la ventana nativa está
 * cerrada, y la salida espera a que termine la transición para evitar frames
 * con formularios antiguos visibles.
 */
export default function AppModal({
    visible,
    onDismiss,
    children,
    animation = 'fade',
    placement = 'center',
    contentStyle,
}) {
    const theme = useTheme();
    const [mounted, setMounted] = useState(Boolean(visible));
    const mountedRef = useRef(Boolean(visible));
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentScale = useRef(new Animated.Value(0.96)).current;
    const contentOffset = useRef(new Animated.Value(animation === 'slide' ? 24 : 0)).current;

    useEffect(() => {
        overlayOpacity.stopAnimation();
        contentOpacity.stopAnimation();
        contentScale.stopAnimation();
        contentOffset.stopAnimation();

        if (visible) {
            mountedRef.current = true;
            setMounted(true);
            overlayOpacity.setValue(0);
            contentOpacity.setValue(0);
            contentScale.setValue(animation === 'slide' ? 1 : 0.96);
            contentOffset.setValue(animation === 'slide' ? 24 : 0);

            Animated.parallel([
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: MODAL_ANIMATION_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(contentOpacity, {
                    toValue: 1,
                    duration: MODAL_ANIMATION_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(contentScale, {
                    toValue: 1,
                    duration: MODAL_ANIMATION_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(contentOffset, {
                    toValue: 0,
                    duration: MODAL_ANIMATION_MS,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
            return undefined;
        }

        if (!mountedRef.current) return undefined;

        Animated.parallel([
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: MODAL_ANIMATION_MS,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(contentOpacity, {
                toValue: 0,
                duration: MODAL_ANIMATION_MS,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(contentScale, {
                toValue: animation === 'slide' ? 1 : 0.96,
                duration: MODAL_ANIMATION_MS,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(contentOffset, {
                toValue: animation === 'slide' ? 24 : 0,
                duration: MODAL_ANIMATION_MS,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            if (finished) {
                mountedRef.current = false;
                setMounted(false);
            }
        });

        return undefined;
    }, [animation, contentOffset, contentOpacity, contentScale, overlayOpacity, visible]);

    useEffect(() => {
        if (Platform.OS !== 'android' || !mounted) return undefined;

        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            onDismiss?.();
            return true;
        });

        return () => subscription.remove();
    }, [mounted, onDismiss]);

    const transform = animation === 'slide'
        ? [{ translateY: contentOffset }]
        : [{ scale: contentScale }];
    const shouldRender = visible || mounted;

    const modalContent = (
        <Animated.View
            style={[
                styles.overlay,
                placement === 'bottom' && styles.bottomOverlay,
                { backgroundColor: theme.dark ? 'rgba(0, 0, 0, 0.62)' : 'rgba(13, 52, 97, 0.38)' },
                { opacity: overlayOpacity },
            ]}
        >
            <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
            <Animated.View
                style={[
                    styles.contentWrapper,
                    placement !== 'bottom' && styles.centerPlacement,
                    placement === 'bottom' && styles.bottomContent,
                    { opacity: contentOpacity, transform },
                    contentStyle,
                ]}
            >
                {children}
            </Animated.View>
        </Animated.View>
    );

    // En móvil, los bottom sheets deben estar sobre toda la aplicación,
    // incluida la barra de tabs. Portal evita que el Modal nativo herede
    // únicamente el alto del área activa de navegación.
    if (placement === 'bottom' && Platform.OS !== 'web') {
        return shouldRender ? <Portal>{modalContent}</Portal> : null;
    }

    return (
        <Modal
            transparent
            visible={shouldRender}
            animationType="none"
            presentationStyle="overFullScreen"
            statusBarTranslucent
            navigationBarTranslucent
            onRequestClose={onDismiss}
        >
            {modalContent}
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        flex: 1,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        elevation: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentWrapper: {
        width: '100%',
        maxHeight: '100%',
        flexShrink: 1,
    },
    centerPlacement: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    bottomOverlay: {
        justifyContent: 'flex-end',
    },
    bottomContent: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxHeight: '100%',
    },
});
