import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { DataTable, Text, Chip } from 'react-native-paper';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../../core/constants/theme';

export default function TripTableComponent({
  data = [],
  emptyMessage = 'No hay viajes para mostrar',
}) {
  const [page, setPage] = useState(0);
  const [itemsPerPage] = useState(10);

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, data.length);
  const paginatedData = data.slice(from, to);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completado': return COLORS.SUCCESS || '#4CAF50';
      case 'cancelado': return COLORS.ERROR || '#F44336';
      case 'en progreso':
      case 'aceptado':
      case 'iniciado':
        return COLORS.PRIMARY || '#2196F3';
      case 'pendiente': return COLORS.WARNING || '#FF9800';
      default: return COLORS.GRAY_500 || '#9E9E9E';
    }
  };

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="titleMedium" style={styles.emptyText}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <DataTable style={styles.table}>
          <DataTable.Header style={styles.tableHeader}>
            <DataTable.Title style={{ flex: 1.5, minWidth: 140 }}>Fecha</DataTable.Title>
            <DataTable.Title style={{ flex: 1.5, minWidth: 150 }}>Pasajero</DataTable.Title>
            <DataTable.Title style={{ flex: 1.5, minWidth: 150 }}>Conductor</DataTable.Title>
            <DataTable.Title style={{ flex: 2, minWidth: 200 }}>Origen</DataTable.Title>
            <DataTable.Title style={{ flex: 2, minWidth: 200 }}>Destino</DataTable.Title>
            <DataTable.Title style={{ flex: 1.2, minWidth: 120 }}>Estado</DataTable.Title>
          </DataTable.Header>

          {paginatedData.map((item) => (
            <DataTable.Row key={item.id} style={styles.tableRow}>
              <DataTable.Cell style={{ flex: 1.5, minWidth: 140 }}>
                <Text variant="bodySmall">{item.Fecha}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={{ flex: 1.5, minWidth: 150 }}>
                <Text variant="bodySmall" style={styles.boldText}>{item.Pasajero}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={{ flex: 1.5, minWidth: 150 }}>
                <Text variant="bodySmall" style={styles.boldText}>{item.Conductor}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={{ flex: 2, minWidth: 200 }}>
                <Text variant="bodySmall" numberOfLines={2}>{item.Origen}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={{ flex: 2, minWidth: 200 }}>
                <Text variant="bodySmall" numberOfLines={2}>{item.Destino}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={{ flex: 1.2, minWidth: 120 }}>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: `${getStatusColor(item.Estado)}20` }}
                  textStyle={{ color: getStatusColor(item.Estado), fontSize: 11, fontWeight: 'bold' }}
                >
                  {item.Estado}
                </Chip>
              </DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(data.length / itemsPerPage)}
            onPageChange={(page) => setPage(page)}
            label={`${from + 1}-${to} de ${data.length}`}
            numberOfItemsPerPage={itemsPerPage}
            showFastPaginationControls
          />
        </DataTable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE || '#FFF',
    borderRadius: BORDER_RADIUS.LG || 12,
    ...SHADOWS.MEDIUM,
    marginTop: SPACING.MD || 16,
    width: '100%',
    maxWidth: 1200,
  },
  table: {
    minWidth: 960,
  },
  tableHeader: {
    backgroundColor: '#f5f7fa',
    borderTopLeftRadius: BORDER_RADIUS.LG || 12,
    borderTopRightRadius: BORDER_RADIUS.LG || 12,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200 || '#E0E0E0',
    minHeight: 60,
  },
  boldText: {
    fontWeight: '600',
    color: COLORS.GRAY_900 || '#212121',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
  },
  emptyText: {
    color: '#888',
  },
});
