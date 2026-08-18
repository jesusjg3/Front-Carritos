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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS, BORDER_RADIUS } from '../../../core/constants/theme';
import { API_ROUTES } from '../../../Config/Routes';
import { useAppContext } from '../../../shared/contexts/AppContext';

export const ReportTripModal = ({ visible, onClose, tripId }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { token, showAlert } = useAppContext();

  const handleClose = () => {
    setSubject('');
    setDescription('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!subject.trim()) {
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
          subject: subject,
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
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={32} color={COLORS.ERROR} />
              </View>
              <Text style={styles.title}>Reportar Problema</Text>
              <Text style={styles.subtitle}>
                La administración revisará tu caso y tomará las medidas correspondientes.
              </Text>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Asunto del reporte</Text>
              
              <View style={styles.chipsContainer}>
                {predefinedSubjects.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.chip,
                      subject === item && styles.chipSelected
                    ]}
                    onPress={() => setSubject(item)}
                  >
                    <Text style={[
                      styles.chipText,
                      subject === item && styles.chipTextSelected
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {subject === 'Otro problema' && (
                <TextInput
                  style={styles.input}
                  placeholder="Escribe el asunto..."
                  value={subject === 'Otro problema' ? '' : subject}
                  onChangeText={setSubject}
                  maxLength={100}
                />
              )}

              <Text style={styles.label}>Detalles de lo sucedido</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Por favor explica qué ocurrió detalladamente..."
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {description.length}/500
              </Text>

            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
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
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: BORDER_RADIUS.XL,
    borderTopRightRadius: BORDER_RADIUS.XL,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.ERROR}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    maxHeight: 400,
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
    padding: 16,
    fontSize: 15,
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: BORDER_RADIUS.MD,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#6C757D',
    marginTop: 8,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.LG,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 16,
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
