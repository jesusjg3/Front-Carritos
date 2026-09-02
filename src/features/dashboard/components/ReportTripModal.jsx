import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions
} from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BORDER_RADIUS, SHADOWS } from '../../../core/constants/theme';
import { MODAL_ANIMATION_MS } from '../../../core/constants/timing';
import { API_ROUTES } from '../../../Config/Routes';
import { useAppContext } from '../../../shared/contexts/AppContext';
import AppModal from '../../../shared/components/AppModal';

const PREDEFINED_SUBJECTS = [
  'Conducción peligrosa',
  'Comportamiento inapropiado',
  'El viaje nunca ocurrió',
  'Objeto perdido',
  'Otro problema',
];

export const ReportTripModal = ({ visible, onClose, tripId }) => {
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const resetTimerRef = useRef(null);
  const { token, showAlert } = useAppContext();
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const dialogHeight = Math.min(height * 0.9, 560);
  const formMaxHeight = Math.max(150, Math.min(310, height * 0.42));

  useEffect(() => () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  useEffect(() => {
    if (visible && resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, [visible]);

  const finalSubject = subject === 'Otro problema' ? customSubject : subject;
  const canSubmit = Boolean(finalSubject.trim() && description.trim());

  const handleClose = () => {
    Keyboard.dismiss();
    onClose?.();

    // Mantiene el formulario visible durante la salida y lo limpia después.
    const resetForm = () => {
      setSubject('');
      setCustomSubject('');
      setDescription('');
    };
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      resetForm();
      resetTimerRef.current = null;
    }, MODAL_ANIMATION_MS);
  };

  const handleSubmit = async () => {
    if (!finalSubject.trim()) {
      showAlert('Error', 'Por favor, selecciona o ingresa el asunto del reporte.', 'warning');
      return;
    }
    
    if (!description.trim()) {
      showAlert('Error', 'Por favor, detalla lo sucedido.', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${API_ROUTES.BASE_URL}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          trip_id: tripId,
          subject: finalSubject,
          description: description
        })
      });

      const data = await response.json();

      if (response.ok) {
        handleClose();
        showAlert('Reporte Enviado', 'Hemos recibido tu reporte. Lo revisaremos pronto.', 'success');
      } else {
        showAlert('Error', data.message || 'No se pudo enviar el reporte.', 'error');
      }
    } catch (error) {
      console.error('Error enviando queja:', error);
      showAlert('Error de Servidor', error.message || 'Ocurrió un problema de conexión.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      visible={visible}
      onDismiss={handleClose}
      animation="fade"
    >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
          style={styles.keyboardView}
        >
          <View style={[styles.dialog, { backgroundColor: theme.colors.surface, maxHeight: dialogHeight }]}>
            <View style={styles.container}>
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.error + '15' }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={32} color={theme.colors.error} />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.title, { color: theme.colors.onSurface }]}>Reportar Problema</Text>
                  <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                    La administración revisará tu caso y tomará las medidas correspondientes.
                  </Text>
                </View>
              </View>

              <ScrollView
                style={[styles.formContainer, { maxHeight: formMaxHeight }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.label, { color: theme.colors.onSurface }]}>Motivo del reporte</Text>

                <View style={styles.chipsContainer}>
                  {PREDEFINED_SUBJECTS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.chip,
                        { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline },
                        subject === item && { backgroundColor: theme.colors.error + '15', borderColor: theme.colors.error }
                      ]}
                      onPress={() => {
                        setSubject(item);
                        if (item !== 'Otro problema') setCustomSubject('');
                      }}
                    >
                      <Text style={[
                        styles.chipText,
                        { color: theme.colors.onSurfaceVariant },
                        subject === item && { color: theme.colors.error, fontWeight: 'bold' }
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {subject === 'Otro problema' && (
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline, color: theme.colors.onSurface }]}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    placeholder="Escribe el asunto..."
                    value={customSubject}
                    onChangeText={setCustomSubject}
                    maxLength={100}
                  />
                )}

                <Text style={[styles.label, { color: theme.colors.onSurface }]}>Detalles de lo sucedido</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline, color: theme.colors.onSurface }]}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  placeholder="Por favor explica qué ocurrió detalladamente..."
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                  maxLength={500}
                />
                <Text style={[styles.characterCount, { color: theme.colors.onSurfaceVariant }]}>
                  {description.length}/500
                </Text>

              </ScrollView>

              <View style={styles.footer}>
                <Button
                  mode="outlined"
                  onPress={handleClose}
                  disabled={loading}
                  textColor={theme.colors.onSurfaceVariant}
                  buttonColor={theme.colors.surfaceVariant}
                  style={[styles.footerButton, { borderColor: theme.colors.outline }]}
                  contentStyle={styles.footerButtonContent}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={loading || !canSubmit}
                  loading={loading}
                  buttonColor={canSubmit ? theme.colors.error : theme.colors.surfaceVariant}
                  textColor={canSubmit ? theme.colors.onError : theme.colors.onSurfaceVariant}
                  style={styles.footerButton}
                  contentStyle={styles.footerButtonContent}
                >
                  Enviar Reporte
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    borderRadius: BORDER_RADIUS.XL,
    borderWidth: 0,
    overflow: 'hidden',
    ...SHADOWS.LARGE,
  },
  keyboardView: {
    width: '100%',
  },
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 1,
  },
  formContainer: {
    minHeight: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 7,
    marginTop: 5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  chip: {
    width: '48%',
    minHeight: 36,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.MD,
    padding: 12,
    fontSize: 15,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.MD,
    padding: 12,
    fontSize: 15,
    minHeight: 82,
    height: 82,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 5,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 7,
  },
  footerButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.LG,
  },
  footerButtonContent: {
    minHeight: 38,
    paddingHorizontal: 8,
  },
});
