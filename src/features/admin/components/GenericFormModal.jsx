import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Dialog,
  Button,
  TextInput,
  SegmentedButtons,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { Text } from 'react-native-paper';
import { COLORS, SPACING, BORDER_RADIUS } from '../../../core/constants/theme';
import UniversalMap from '../../../shared/components/UniversalMap';

/**
 * Modal genérico reutilizable para crear/editar cualquier entidad
 * @param {Object} props
 * @param {boolean} props.visible - Control de visibilidad del modal
 * @param {Function} props.onDismiss - Callback al cerrar el modal
 * @param {Function} props.onSubmit - Callback al enviar el formulario
 * @param {Object} props.data - Datos de la entidad (para modo edición)
 * @param {Array} props.fields - Array de configuración de campos
 * @param {boolean} props.isLoading - Indicador de carga
 * @param {string} props.title - Título del modal
 * @param {string} props.submitText - Texto del botón de envío
 * 
 * Estructura de fields:
 * [
 *   {
 *     name: 'name',
 *     label: 'Nombre',
 *     type: 'text',
 *     placeholder: 'Ej: Juan',
 *     required: true,
 *     validate: (value) => boolean
 *   },
 *   {
 *     name: 'email',
 *     label: 'Email',
 *     type: 'email',
 *     required: true
 *   },
 *   {
 *     name: 'rol_id',
 *     label: 'Rol',
 *     type: 'select',
 *     options: [{ id: 1, label: 'Admin' }],
 *     required: true
 *   }
 * ]
 */
export default function GenericFormModal({
  visible,
  onDismiss,
  onSubmit,
  data = null,
  fields = [],
  isLoading = false,
  title = 'Formulario',
  submitText = 'Guardar',
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const isEditMode = !!data;

  // Inicializar datos del formulario
  useEffect(() => {
    if (visible) {
      const initialData = {};
      fields.forEach((field) => {
        initialData[field.name] = isEditMode && data ? data[field.name] || '' : '';
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [visible, data, fields, isEditMode]);

  const validateForm = () => {
    const newErrors = {};

    fields.forEach((field) => {
      const value = formData[field.name];

      if (field.required && !value) {
        newErrors[field.name] = `${field.label} es requerido`;
      } else if (field.validate && value && !field.validate(value)) {
        newErrors[field.name] = field.errorMessage || `${field.label} no es válido`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: '' });
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      setSnackbar({
        visible: true,
        message: 'Por favor completa todos los campos requeridos'
      });
      console.log('Errores de validación:', errors);
      return;
    }

    // Convertir tipos de datos según el campo
    const submitData = { ...formData };
    fields.forEach((field) => {
      if (field.type === 'select' || field.type === 'number') {
        submitData[field.name] = parseInt(submitData[field.name]) || submitData[field.name];
      }
    });

    console.log('Enviando datos:', submitData);
    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({});
    setErrors({});
    onDismiss();
  };

  const renderField = (field) => {
    const fieldValue = formData[field.name] || '';
    const fieldError = errors[field.name];

    switch (field.type) {
      case 'select':
        return (
          <View key={field.name}>
            <Text variant="labelMedium" style={styles.label}>
              {field.label}
              {field.required && <Text style={{ color: COLORS.ERROR }}>*</Text>}
            </Text>
            <SegmentedButtons
              value={fieldValue.toString()}
              onValueChange={(value) => handleFieldChange(field.name, value)}
              buttons={
                field.options?.map((option) => ({
                  value: option.id.toString(),
                  label: option.label || option.rol_name || option.state_name || option.tab_name,
                  disabled: isLoading,
                })) || []
              }
              style={styles.segmentedButtons}
            />
            {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}
          </View>
        );

      case 'number':
        return (
          <View key={field.name}>
            <TextInput
              label={field.label + (field.required ? ' *' : '')}
              value={fieldValue.toString()}
              onChangeText={(text) => handleFieldChange(field.name, text)}
              mode="outlined"
              style={styles.input}
              placeholder={field.placeholder}
              keyboardType="numeric"
              editable={!isLoading}
              error={!!fieldError}
            />
            {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}
          </View>
        );

      case 'email':
        return (
          <View key={field.name}>
            <TextInput
              label={field.label + (field.required ? ' *' : '')}
              value={fieldValue}
              onChangeText={(text) => handleFieldChange(field.name, text)}
              mode="outlined"
              style={styles.input}
              placeholder={field.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              error={!!fieldError}
            />
            {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}
          </View>
        );

      case 'password':
        return (
          <View key={field.name}>
            <TextInput
              label={field.label + (field.required ? ' *' : '')}
              value={fieldValue}
              onChangeText={(text) => handleFieldChange(field.name, text)}
              mode="outlined"
              style={styles.input}
              placeholder={field.placeholder}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
              error={!!fieldError}
            />
            {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}
          </View>
        );

      case 'textarea':
        return (
          <View key={field.name}>
            <TextInput
              label={field.label + (field.required ? ' *' : '')}
              value={fieldValue}
              onChangeText={(text) => handleFieldChange(field.name, text)}
              mode="outlined"
              style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
              placeholder={field.placeholder}
              multiline
              numberOfLines={4}
              editable={!isLoading}
              error={!!fieldError}
            />
            {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}
          </View>
        );

      case 'map_picker':
        return (
          <View key={field.name} style={{ height: 500, marginBottom: SPACING.MD }}>
            <Text variant="labelMedium" style={styles.label}>
              {field.label}
              {field.required && <Text style={{ color: COLORS.ERROR }}>*</Text>}
            </Text>
            <View style={{ flex: 1, borderRadius: BORDER_RADIUS.MD, overflow: 'hidden', borderWidth: 1, borderColor: errors[field.name] ? COLORS.ERROR : COLORS.GRAY_400 }}>
              <UniversalMap
                source={{
                  html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                    <style>
                      body { margin: 0; padding: 0; }
                      #map { width: 100%; height: 100vh; }
                    </style>
                  </head>
                  <body>
                    <div id="map"></div>
                    <script>
                      // AQUI ABAJO AJUSTAS EL ZOOM: Cambia el '14' (después de las coordenadas) al tamaño de zoom ideal a ojo
                      var centerLat = ${process.env.EXPO_PUBLIC_CAMPUS_CENTER_LAT};
                      var centerLng = ${process.env.EXPO_PUBLIC_CAMPUS_CENTER_LNG};
                      var map = L.map('map').setView([centerLat, centerLng], 17); // Centro Localizado
                      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                      
                      var marker;
                      
                      var initLat = ${formData.latitude ? formData.latitude : 'null'};
                      var initLng = ${formData.longitude ? formData.longitude : 'null'};
                      if(initLat !== null && initLng !== null) {
                          marker = L.marker([initLat, initLng]).addTo(map);
                          map.setView([initLat, initLng], 15);
                      }

                      map.on('click', function(e) {
                        if (marker) {
                          map.removeLayer(marker);
                        }
                        marker = L.marker(e.latlng).addTo(map);
                        
                        var message = JSON.stringify({ type: 'location_selected', lat: e.latlng.lat, lng: e.latlng.lng });
                        if (window.ReactNativeWebView) {
                          window.ReactNativeWebView.postMessage(message);
                        } else {
                          window.parent.postMessage(message, '*');
                        }
                      });
                    </script>
                  </body>
                  </html>
                `}}
                onMessage={(event) => {
                  try {
                    const parsedData = JSON.parse(event.nativeEvent.data);
                    if (parsedData.type === 'location_selected' && field.onSelect) {
                      const updates = field.onSelect(parsedData.lat, parsedData.lng);
                      setFormData((prev) => ({ ...prev, ...updates }));
                      if (errors[field.name]) {
                        setErrors({ ...errors, [field.name]: '' });
                      }
                    }
                  } catch (e) { }
                }}
              />
            </View>
            <Text style={{ fontSize: 11, color: COLORS.GRAY_600, marginTop: 4 }}>Toca el mapa para establecer las coordenadas automáticamente.</Text>
            {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}
          </View>
        );

      default: // text
        return (
          <View key={field.name}>
            <TextInput
              label={field.label + (field.required ? ' *' : '')}
              value={fieldValue}
              onChangeText={(text) => handleFieldChange(field.name, text)}
              mode="outlined"
              style={styles.input}
              placeholder={field.placeholder}
              editable={!isLoading}
              error={!!fieldError}
            />
            {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}
          </View>
        );
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleClose} contentContainerStyle={styles.modal}>
        <Dialog visible={visible} onDismiss={handleClose} style={styles.dialog}>
          <Dialog.Title style={styles.title}>{title}</Dialog.Title>

          <Dialog.Content>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollInner}
            >
              {isLoading ? (
                <ActivityIndicator
                  animating
                  size="large"
                  color={COLORS.PRIMARY}
                  style={{ marginVertical: SPACING.LG }}
                />
              ) : (
                fields.map((field) => renderField(field))
              )}
            </ScrollView>
          </Dialog.Content>

          <Dialog.Actions style={styles.actions}>
            <Button
              mode="text"
              onPress={handleClose}
              disabled={isLoading}
              textColor={COLORS.GRAY_600}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={isLoading}
              loading={isLoading}
              style={styles.submitButton}
              buttonColor={COLORS.PRIMARY}
            >
              {submitText}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Modal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dialog: {
    width: '94%',
    maxHeight: '80%',
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    elevation: 6,
  },
  title: {
    color: COLORS.PRIMARY,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    maxHeight: 420,
  },
  scrollInner: {
    paddingVertical: SPACING.SM,
    paddingBottom: SPACING.LG,
    gap: SPACING.MD,
  },
  input: {
    marginBottom: SPACING.MD,
    backgroundColor: COLORS.WHITE,
  },
  label: {
    marginBottom: SPACING.SM,
    color: COLORS.GRAY_700,
    fontWeight: '600',
  },
  segmentedButtons: {
    marginBottom: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 12,
    marginTop: -SPACING.SM,
    marginBottom: SPACING.SM,
  },
  actions: {
    justifyContent: 'flex-end',
    paddingTop: SPACING.MD,
  },
  submitButton: {
    marginLeft: SPACING.SM,
  },
});
