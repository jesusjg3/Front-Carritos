import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Keyboard,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useTheme, Dialog, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../../core/constants/theme';
import { API_ROUTES } from '../../../Config/Routes';
import { useAppContext } from '../../../shared/contexts/AppContext';

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
  const { token, showAlert } = useAppContext();
  const theme = useTheme();

  const handleClose = () => {
    Keyboard.dismiss();
    onClose?.();

    // Limpia el formulario después de ocultarlo para que el cierre no espere
    // el re-render de los TextInput controlados.
    const resetForm = () => {
      setSubject('');
      setCustomSubject('');
      setDescription('');
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(resetForm);
    else setTimeout(resetForm, 0);
  };

  const handleSubmit = async () => {
    const finalSubject = subject === 'Otro problema' ? customSubject : subject;
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
    <Portal>
      <Dialog visible={visible} onDismiss={handleClose} style={styles.dialog}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
          style={styles.keyboardView}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={32} color={COLORS.ERROR} />
              </View>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>Reportar Problema</Text>
              <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                La administración revisará tu caso y tomará las medidas correspondientes.
              </Text>
            </View>

            <ScrollView
              style={styles.formContainer}
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
                      subject === item && styles.chipSelected
                    ]}
                    onPress={() => {
                      setSubject(item);
                      if (item !== 'Otro problema') setCustomSubject('');
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: theme.colors.onSurfaceVariant },
                      subject === item && styles.chipTextSelected
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
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.onSurfaceVariant }]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Enviar Reporte</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 380,
    alignSelf: 'center',
  },
  keyboardView: {
    width: '100%',
  },
  container: {
    width: '100%',
    borderRadius: BORDER_RADIUS.XL,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    maxHeight: '94%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.ERROR}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    maxHeight: 380,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.BLACK,
    marginBottom: 12,
    marginTop: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: `${COLORS.ERROR}15`,
    borderColor: COLORS.ERROR,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.ERROR,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.MD,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.MD,
    padding: 12,
    fontSize: 15,
    minHeight: 96,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.LG,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1.35,
    height: 40,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: COLORS.ERROR,
    alignItems: 'center',
    ...SHADOWS.SMALL,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
