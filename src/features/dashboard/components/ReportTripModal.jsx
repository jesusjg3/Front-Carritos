import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../../core/constants/theme';
import { API_ROUTES } from '../../../Config/Routes';
import { useAppContext } from '../../../shared/contexts/AppContext';

export const ReportTripModal = ({ visible, onClose, tripId }) => {
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { token, showAlert } = useAppContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    setSubject('');
    setCustomSubject('');
    setDescription('');
    onClose();
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
        showAlert('Reporte Enviado', 'Hemos recibido tu reporte. Lo revisaremos pronto.', 'success');
        handleClose();
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

  const predefinedSubjects = [
    "Conducción peligrosa",
    "Comportamiento inapropiado",
    "El viaje nunca ocurrió",
    "Objeto perdido",
    "Otro problema"
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
          style={styles.keyboardView}
        >
          <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={32} color={COLORS.ERROR} />
              </View>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>Reportar Problema</Text>
              <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                La administración revisará tu caso y tomará las medidas correspondientes.
              </Text>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>Asunto del reporte</Text>
              
              <View style={styles.chipsContainer}>
                {predefinedSubjects.map((item, index) => (
                  <TouchableOpacity
                    key={index}
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
                style={styles.cancelButton} 
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#FFF',
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
    color: '#6C757D',
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
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  chipSelected: {
    backgroundColor: `${COLORS.ERROR}15`,
    borderColor: COLORS.ERROR,
  },
  chipText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.ERROR,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: BORDER_RADIUS.MD,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: BORDER_RADIUS.MD,
    padding: 12,
    fontSize: 15,
    minHeight: 96,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#6C757D',
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
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#495057',
    fontSize: 14,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 9,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});
