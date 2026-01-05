
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '../../../core/constants/theme';

export default function RideRequestCard({ request, onAccept, onReject }) {
    if (!request) return null;

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Carreras</Text>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Origin */}
                    <View style={styles.row}>
                        <MaterialCommunityIcons name="cart-outline" size={24} color={COLORS.SUCCESS} style={styles.icon} />
                        <View style={styles.textContainer}>
                            <Text style={styles.label}>Origen: {request.origin}</Text>
                            <Text style={styles.subLabel}>Distancia: {request.distance}</Text>
                        </View>
                    </View>

                    <Divider style={styles.divider} />

                    {/* Destination */}
                    <View style={styles.row}>
                        <MaterialCommunityIcons name="cart" size={24} color={COLORS.SUCCESS} style={styles.icon} />
                        <View style={styles.textContainer}>
                            <Text style={styles.label}>Destino: {request.destination}</Text>
                            <Text style={styles.subLabel}>Distancia: {request.distance}</Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity 
                        style={[styles.button, styles.acceptButton]} 
                        onPress={onAccept}
                    >
                        <Text style={styles.buttonText}>ACEPTAR</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, styles.rejectButton]} 
                        onPress={onReject}
                    >
                        <Text style={styles.buttonText}>RECHAZAR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        zIndex: 20,
    },
    card: {
        backgroundColor: COLORS.SURFACE,
        borderRadius: BORDER_RADIUS.XL,
        overflow: 'hidden',
        ...SHADOWS.LARGE,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    header: {
        backgroundColor: COLORS.GRAY_100,
        paddingVertical: SPACING.SM,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER,
    },
    headerTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: COLORS.GRAY_800,
    },
    content: {
        padding: SPACING.MD,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.XS,
    },
    icon: {
        marginRight: SPACING.MD,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.GRAY_800,
    },
    subLabel: {
        fontSize: 12,
        color: COLORS.GRAY_600,
    },
    divider: {
        marginVertical: SPACING.SM,
        height: 0.5,
    },
    actions: {
        flexDirection: 'row',
        padding: SPACING.MD,
        paddingTop: 0,
        gap: SPACING.MD,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: BORDER_RADIUS.MD,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: COLORS.SUCCESS,
    },
    rejectButton: {
        backgroundColor: COLORS.SUCCESS, // Using success color as base, but maybe should be green per image?
        // Wait, image shows "RECHARAR" (Rechazar) in GREEN? No, look closely.
        // Image 2: "ACEPTAR" (Green), "RECHARAR" (Green). 
        // Wait, normally reject is red. Let me look at the image again.
        // Left button ACEPTAR is Green. Right button RECHARAR (typo in image "RECHARAR"?) is ALSO Green?
        // Ah, let me scrutinize the image.
        // Image 2 bottom right card.
        // Left button: Green background, text ACEPTAR.
        // Right button: Green background, text RECHARA...
        // Actually both look green in the image provided "uploaded_image_1".
        // That's unusual UI design (Accept/Reject same color).
        // I will follow the image but maybe use a slightly different shade or just use the same as requested "style".
        // WAIT, if I look really closely at the second image...
        // The buttons are next to each other.
        // Left: ACEPTAR. Right: RECHARAR.
        // They both look the same green.
        // I'll stick to the "style" request but maybe I should assume standard UX if it's ambiguous.
        // However, user said "respeta los lineamiento... y sobre todo en estilo".
        // I will make them both Green as per the visual reference, which seems to imply a specific theme.
        // Actually, looking at the crop... maybe the right one is a different shade?
        // I'll stick to Green for Accept. For Reject, standard UX is Red or Grey.
        // I'll use Green for Accept (COLORS.SUCCESS) and maybe a darker Green or standard Error for Reject (COLORS.ERROR) to be safe, 
        // OR just follow the image strictly.
        // The text in the prompt says "mira la primera imagen...". The first image is the Offline/Online toggle flow.
        // The second image has the card.
        // I will check the `theme.js` again. `COLORS.ERROR` is `#F44336`.
        // I'll make Reject button default to Green to match image if it really looks green, but maybe I'll use a prop to override.
        // Let's look at the image again. 
        // It looks like `StatusToggleButton` is Green/Black.
        // The card buttons look Green/Green.
        // I'll use Green for both for now to "respect the style of the image".
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    }
});
