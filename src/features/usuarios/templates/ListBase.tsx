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
import { Usuario } from '../services/userService';
import { FiltrosUsuarios } from '../hooks/useList';

interface ListBaseProps {
  usuariosFiltrados: Usuario[];
  loading: boolean;
  filtros: FiltrosUsuarios;
  setFiltros: (filtros: FiltrosUsuarios) => void;
  stats: {
    total: number;
    activos: number;
    admins: number;
    jugadores: number;
    entrenadores: number;
    apoderados: number;
  };
  onUserEdit?: (usuario: Usuario) => void;
  onUserDelete?: (usuario: Usuario) => void;
  renderUserCard: (usuario: Usuario) => React.ReactNode;
}

const ListBase = (props: ListBaseProps) => {
  const {
    usuariosFiltrados,
    loading,
    filtros,
    setFiltros,
    stats,
    onUserEdit,
    onUserDelete,
    renderUserCard,
  } = props;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Estadísticas */}
      <View style={styles.section}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={colors.primary} />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Usuarios</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.statNumber}>{stats.activos}</Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="shield" size={24} color="#DC2626" />
            <Text style={styles.statNumber}>{stats.admins}</Text>
            <Text style={styles.statLabel}>Administradores</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="person" size={24} color="#059669" />
            <Text style={styles.statNumber}>{stats.jugadores}</Text>
            <Text style={styles.statLabel}>Jugadores</Text>
          </View>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.section}>
        <View style={styles.filtrosContainer}>
          <View style={styles.busquedaContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.busquedaInput}
              placeholder="Buscar por nombre, apellido o email..."
              value={filtros.busqueda}
              onChangeText={(text: string) => setFiltros({ ...filtros, busqueda: text })}
            />
          </View>

          <View style={styles.filtrosRow}>
            <View style={styles.filtroGroup}>
              <Text style={styles.filtroLabel}>Rol</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosScroll}>
                <View style={styles.filtrosChips}>
                  {['todos', 'admin', 'jugador', 'entrenador', 'apoderado'].map((rol) => (
                    <TouchableOpacity
                      key={rol}
                      style={[
                        styles.filtroChip,
                        filtros.rol === rol && styles.filtroChipActive
                      ]}
                      onPress={() => setFiltros({ ...filtros, rol })}
                    >
                      <Text style={[
                        styles.filtroChipText,
                        filtros.rol === rol && styles.filtroChipTextActive
                      ]}>
                        {rol === 'todos' ? 'Todos' : rol}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filtroGroup}>
              <Text style={styles.filtroLabel}>Estado</Text>
              <View style={styles.filtrosChips}>
                {['todos', 'activo', 'inactivo'].map((estado) => (
                  <TouchableOpacity
                    key={estado}
                    style={[
                      styles.filtroChip,
                      filtros.estado === estado && styles.filtroChipActive
                    ]}
                    onPress={() => setFiltros({ ...filtros, estado })}
                  >
                    <Text style={[
                      styles.filtroChipText,
                      filtros.estado === estado && styles.filtroChipTextActive
                    ]}>
                      {estado === 'todos' ? 'Todos' : estado}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Lista de usuarios */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Usuarios ({usuariosFiltrados.length})
          </Text>
        </View>

        {usuariosFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No se encontraron usuarios</Text>
            <Text style={styles.emptySubtitle}>
              {filtros.busqueda || filtros.rol !== 'todos' || filtros.estado !== 'todos'
                ? 'Intenta con otros filtros de búsqueda'
                : 'No hay usuarios registrados en el sistema'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.usuariosList}>
            {usuariosFiltrados.map((usuario: Usuario) => (
              <View key={usuario.id_usuario}>
                {renderUserCard(usuario)}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
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
  filtrosRow: {
    gap: spacing.lg,
  },
  filtroGroup: {
    gap: spacing.sm,
  },
  filtroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  filtrosScroll: {
    flexGrow: 0,
  },
  filtrosChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filtroChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtroChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  filtroChipTextActive: {
    color: colors.text.inverse,
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
  usuariosList: {
    gap: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});

export default ListBase;
