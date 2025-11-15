import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '../../../shared/constants/theme';

interface FiltrosReportes {
  busqueda: string;
  tipo: string;
  estado: string;
}

interface ListBaseProps {
  items: any[];
  loading: boolean;
  filtros: FiltrosReportes;
  setFiltros: (filtros: FiltrosReportes) => void;
  stats: Record<string, any>;
  onItemEdit?: (item: any) => void;
  onItemDelete?: (item: any) => void;
  renderItemCard: (item: any) => React.ReactNode;
  renderFilters?: () => React.ReactNode;
  renderStats?: () => React.ReactNode;
  emptyStateMessage?: string;
  searchPlaceholder?: string;
  title?: string;
}

export default function ListBase({
  items,
  loading,
  filtros,
  setFiltros,
  stats,
  onItemEdit,
  onItemDelete,
  renderItemCard,
  renderFilters,
  renderStats,
  emptyStateMessage = "No se encontraron reportes",
  searchPlaceholder = "Buscar reportes...",
  title = "Reportes",
}: ListBaseProps) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Estadísticas */}
      {renderStats && (
        <View style={styles.section}>
          {renderStats()}
        </View>
      )}

      {/* Filtros */}
      <View style={styles.section}>
        <View style={styles.filtrosContainer}>
          <View style={styles.busquedaContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.busquedaInput}
              placeholder={searchPlaceholder}
              value={filtros.busqueda || ''}
              onChangeText={(text) => setFiltros({ ...filtros, busqueda: text })}
            />
          </View>

          {renderFilters && renderFilters()}
        </View>
      </View>

      {/* Lista de reportes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {title} ({items.length})
          </Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>{emptyStateMessage}</Text>
            <Text style={styles.emptySubtitle}>
              {filtros.busqueda ? 'Intenta con otros filtros de búsqueda' : 'No hay reportes generados aún'}
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {items.map((item, index) => (
              <View key={index}>
                {renderItemCard(item)}
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.lg,
    ...typography.body,
    color: colors.text.secondary,
  },
  section: {
    padding: spacing.lg,
  },
  filtrosContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  busquedaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  busquedaInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.text.primary,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptyState: {
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  itemsList: {
    gap: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
