import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../shared/constants/theme';

interface FormBaseProps<T> {
  formData: T;
  setFormData: (data: T) => void;
  errors: Record<string, string>;
  loading: boolean;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  renderBasicFields: () => React.ReactNode;
  renderAdditionalFields?: () => React.ReactNode;
  title?: string;
  saveButtonText?: string;
}

export default function FormBase<T>({
  formData,
  setFormData,
  errors,
  loading,
  isEditing,
  onSave,
  onCancel,
  renderBasicFields,
  renderAdditionalFields,
  title = "Formulario",
  saveButtonText,
}: FormBaseProps<T>) {
  const renderCampo = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    errorKey: string,
    placeholder?: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' | 'numeric' = 'default',
    secureTextEntry = false,
    required = false,
    multiline = false
  ) => (
    <View style={styles.campoContainer}>
      <Text style={styles.campoLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.campoInput,
          errors[errorKey] && styles.campoInputError,
          multiline && styles.campoInputMultiline
        ]}
        value={value}
        onChangeText={(text) => {
          onChange(text);
          // Clear error when user starts typing
          if (errors[errorKey]) {
            // This would need to be handled in the parent
          }
        }}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {errors[errorKey] && (
        <Text style={styles.errorText}>{errors[errorKey]}</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isEditing ? 'Editar' : 'Crear'} {title}
        </Text>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Básica</Text>
        {renderBasicFields()}
      </View>

      {/* Additional fields */}
      {renderAdditionalFields && renderAdditionalFields()}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={isEditing ? "save" : "add"}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.saveButtonText}>
                {saveButtonText || (isEditing ? 'Actualizar' : 'Crear')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  campoContainer: {
    marginBottom: spacing.lg,
  },
  campoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  required: {
    color: '#DC2626',
  },
  campoInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 50,
  },
  campoInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  campoInputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: spacing.xs,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
