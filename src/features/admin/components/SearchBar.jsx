import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../../core/constants/theme';

/**
 * Barra de búsqueda reutilizable
 * @param {Object} props
 * @param {string} props.placeholder - Texto placeholder
 * @param {Function} props.onSearch - Callback con el texto de búsqueda
 * @param {Function} props.onClear - Callback al limpiar
 * @param {string} props.value - Valor controlado
 */
export default function SearchBar({ 
  placeholder = 'Buscar...', 
  onSearch, 
  onClear,
  value: controlledValue,
}) {
  const [internalValue, setInternalValue] = useState('');
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = controlledValue !== undefined ? onSearch : setInternalValue;

  const handleClear = () => {
    setValue('');
    if (onClear) onClear();
  };

  const handleChangeText = (text) => {
    setValue(text);
    if (onSearch) onSearch(text);
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name="magnify" 
        size={24} 
        color={COLORS.GRAY_500} 
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.GRAY_400}
        value={value}
        onChangeText={handleChangeText}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <IconButton
          icon="close-circle"
          size={20}
          iconColor={COLORS.GRAY_500}
          onPress={handleClear}
          style={styles.clearButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    paddingHorizontal: SPACING.SM,
    height: 40,
    ...SHADOWS.SMALL,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    maxWidth: 1200,
    width: '100%',
    marginBottom: SPACING.SM,
  },
  searchIcon: {
    marginRight: SPACING.XS,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.GRAY_900,
    padding: 0,
  },
  clearButton: {
    margin: 0,
  },
});
