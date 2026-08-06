import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

const UniversalMap = forwardRef(({ source, style, onMessage, onLoadEnd, scrollEnabled = true, ...props }, ref) => {
    // Importación dinámica para evitar crasheos en el entorno web.
    // En Web, no cargamos react-native-webview porque tira error.
    let WebView = null;
    if (Platform.OS !== 'web') {
        WebView = require('react-native-webview').WebView;
    }

    const iframeRef = useRef(null);
    const nativeWebViewRef = useRef(null);

    // Configurar listener manual para los mensajes desde el iframe
    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleFrameMessage = (event) => {
                // Solo escuchamos mensajes en web
                try {
                    let dataObj = event.data;
                    if (typeof event.data === 'string') {
                        dataObj = JSON.parse(event.data);
                    }
                    if (dataObj && dataObj.type && onMessage) {
                        onMessage({ nativeEvent: { data: JSON.stringify(dataObj) } });
                    }
                } catch (e) {
                    // Ignorar mensajes no-JSON u otros errores
                }
            };
            window.addEventListener('message', handleFrameMessage);
            return () => window.removeEventListener('message', handleFrameMessage);
        }
    }, [onMessage]);

    useImperativeHandle(ref, () => ({
        injectJavaScript: (script) => {
            if (Platform.OS === 'web') {
                if (iframeRef.current && iframeRef.current.contentWindow) {
                    // Mandar mensaje tipo EVAL al iframe para inyectar JS en web
                    iframeRef.current.contentWindow.postMessage({ type: 'EVAL', code: script }, '*');
                }
            } else {
                if (nativeWebViewRef.current) {
                    // Llamada nativa de react-native-webview
                    nativeWebViewRef.current.injectJavaScript(script);
                }
            }
        }
    }));

    if (Platform.OS === 'web') {
        const { html } = source;
        return (
            <iframe
                ref={iframeRef}
                title="mapa-universal"
                srcDoc={html}
                style={{ width: '100%', height: '100%', border: 'none', ...style }}
                onLoad={() => {
                    if (onLoadEnd) onLoadEnd();
                }}
            />
        );
    }

    // Retorna WebView solo si no estamos en Web
    // inyectamos un baseUrl falso HTTP para que no bloquee las peticiones http://192.168.10.96:5000 por Mixed Content
    return (
        <WebView
            ref={nativeWebViewRef}
            source={{ ...source, baseUrl: 'http://campus.local' }}
            style={style}
            onMessage={onMessage}
            onLoadEnd={onLoadEnd}
            scrollEnabled={scrollEnabled}
            originWhitelist={['*']}
            {...props}
        />
    );
});

export default UniversalMap;
