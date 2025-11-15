import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '../../../shared/constants/theme';
import { Usuario } from '../services/userService';

interface DetailBaseProps {
  usuario: Usuario;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  renderAdditionalInfo?: () => React.ReactNode;
}

export default function DetailBase({
  usuario,
  onEdit,
  onDelete,
  onBack,
  renderAdditionalInfo,
}: DetailBaseProps) {
  const getRolIcon = (rol: string) => {
    switch (rol) {
      case 'admin': return 'shield';
      case 'entrenador': return 'fitness';
      case 'jugador': return 'person';
      case 'apoderado': return 'people';
      default: return 'help';
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin': return '#DC2626';
      case 'entrenador': return '#2563EB';
      case 'jugador': return '#059669';
      case 'apoderado': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
            </Text>
          </View>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>
            {usuario.nombre} {usuario.apellido}
          </Text>
          <Text style={styles.userEmail}>{usuario.correo}</Text>
          <View style={styles.rolBadge}>
            <Ionicons
              name={getRolIcon(usuario.rol)}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.rolText}>{usuario.rol}</Text>
          </View>
        </View>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Básica</Text>

        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color={colors.text.secondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Nombre completo</Text>
            <Text style={styles.infoValue}>
              {usuario.nombre} {usuario.apellido}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color={colors.text.secondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Correo electrónico</Text>
            <Text style={styles.infoValue}>{usuario.correo}</Text>
          </View>
        </View>

        {usuario.telefono && (
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color={colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{usuario.telefono}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={20} color={colors.text.secondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Fecha de registro</Text>
            <Text style={styles.infoValue}>
              {formatDate(usuario.fecha_registro)}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name={usuario.estado_cuenta ? "checkmark-circle" : "close-circle"}
            size={20}
            color={usuario.estado_cuenta ? colors.success : colors.error}
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Estado de cuenta</Text>
            <Text style={[
              styles.infoValue,
              { color: usuario.estado_cuenta ? colors.success : colors.error }
            ]}>
              {usuario.estado_cuenta ? 'Activa' : 'Inactiva'}
            </Text>
          </View>
        </View>
      </View>

      {/* Role-specific information */}
      {renderAdditionalInfo && renderAdditionalInfo()}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {onEdit && (
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Ionicons name="pencil" size={20} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        )}

        {onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Ionicons name="trash" size={20} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarContainer: {
    marginRight: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  rolText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    margin: spacing.lg,
    marginTop: 0,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  editButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
