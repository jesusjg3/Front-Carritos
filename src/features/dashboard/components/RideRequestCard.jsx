
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
                {/* Header removed to save space */}

                {/* Content */}
                <View style={styles.content}>
                    {/* Locations Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.subLabel}>Origen</Text>
                            <Text style={styles.statValue} numberOfLines={2}>{request.origin}</Text>
                        </View>

                        <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.GRAY_400 || '#9e9e9e'} style={{ marginTop: 10 }} />

                        <View style={styles.statItem}>
                            <Text style={styles.subLabel}>Destino</Text>
                            <Text style={styles.statValue} numberOfLines={2}>{request.destination}</Text>
                        </View>
                    </View>

                    {/* Metadata Row (Passengers | Distance) */}
                    <View style={styles.metadataRow}>
                        <View style={styles.metaItem}>
                            <MaterialCommunityIcons name="account-group" size={20} color={COLORS.PRIMARY} />
                            <Text style={styles.metaText}>
                                {request.passengers_count || 1} {(request.passengers_count || 1) === 1 ? 'Pasajero' : 'Pasajeros'}
                            </Text>
                        </View>

                        <View style={styles.verticalDivider} />

                        <View style={styles.metaItem}>
                            <MaterialCommunityIcons name="map-marker-distance" size={18} color={COLORS.GRAY_600} />
                            <Text style={styles.metaText}>{request.distance}</Text>
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
        marginBottom: 10, // Relative positioning for list stacking
        backgroundColor: 'transparent',
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
        padding: SPACING.SM, // Reduced from MD
        paddingBottom: 0,
    },
    passengersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.XS,
        backgroundColor: COLORS.GRAY_50,
        padding: SPACING.SM,
        borderRadius: BORDER_RADIUS.MD,
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
        padding: SPACING.SM, // Reduced from MD
        gap: SPACING.MD,
    },
    button: {
        flex: 1,
        paddingVertical: 8, // Reduced from 12
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
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.SM,
        gap: 8,
    },
    statItem: {
        flex: 1,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.GRAY_800,
        marginTop: 2,
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.GRAY_50,
        padding: SPACING.SM,
        borderRadius: BORDER_RADIUS.MD,
        marginTop: SPACING.XS,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    verticalDivider: {
        width: 1,
        height: 20,
        backgroundColor: COLORS.GRAY_200,
        marginHorizontal: SPACING.SM,
    },
    metaText: {
        marginLeft: 8,
        fontSize: 13,
        color: COLORS.GRAY_700,
        fontWeight: '500',
    }
});
