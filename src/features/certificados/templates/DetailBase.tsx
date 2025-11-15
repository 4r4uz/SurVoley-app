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

interface DetailBaseProps<T> {
  item: T;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  renderHeader?: () => React.ReactNode;
  renderBasicInfo?: () => React.ReactNode;
  renderAdditionalInfo?: () => React.ReactNode;
  renderActions?: () => React.ReactNode;
  title?: string;
}

export default function DetailBase<T>({
  item,
  onEdit,
  onDelete,
  onBack,
  renderHeader,
  renderBasicInfo,
  renderAdditionalInfo,
  renderActions,
  title = "Detalles",
}: DetailBaseProps<T>) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      {renderHeader && (
        <View style={styles.header}>
          {renderHeader()}
        </View>
      )}

      {/* Basic Information */}
      {renderBasicInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          {renderBasicInfo()}
        </View>
      )}

      {/* Additional information */}
      {renderAdditionalInfo && renderAdditionalInfo()}

      {/* Actions */}
      {renderActions && (
        <View style={styles.actionsContainer}>
          {renderActions()}
        </View>
      )}

      {/* Default Actions */}
      {(!renderActions && (onEdit || onDelete)) && (
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
      )}

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
    backgroundColor: colors.surface,
    padding: spacing.xl,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
