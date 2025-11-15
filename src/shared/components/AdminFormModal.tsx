import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/theme";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "select" | "toggle";
  value: any;
  onChange: (value: any) => void;
  required?: boolean;
  placeholder?: string;
  icon?: string;
  options?: { label: string; value: any }[];
}

export interface FormSection {
  title: string;
  icon: string;
  fields: FormField[];
}

interface AdminFormModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  icon: string;
  sections: FormSection[];
  onSave: () => void;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

const AdminFormModal: React.FC<AdminFormModalProps> = ({
  visible,
  title,
  subtitle,
  icon,
  sections,
  onSave,
  onCancel,
  isEditing = false,
  loading = false,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.required && !field.value) {
          newErrors[field.name] = `${field.label} es requerido`;
        }
        if (field.type === "email" && field.value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(field.value)) {
            newErrors[field.name] = "Email inválido";
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave();
    }
  };

  const renderField = (field: FormField) => {
    const hasError = errors[field.name];

    switch (field.type) {
      case "text":
      case "email":
        return (
          <View key={field.name} style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              {field.icon && (
                <Ionicons name={field.icon as any} size={16} color={colors.primaryLight} />
              )}
              <Text style={styles.fieldLabel}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
            </View>
            <TextInput
              style={[styles.textInput, hasError && styles.inputError]}
              placeholder={field.placeholder}
              value={field.value}
              onChangeText={field.onChange}
              keyboardType={field.type === "email" ? "email-address" : "default"}
              autoCapitalize={field.type === "email" ? "none" : "words"}
              editable={!loading}
            />
            {hasError && <Text style={styles.errorText}>{hasError}</Text>}
          </View>
        );

      case "select":
        return (
          <View key={field.name} style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <Ionicons name="chevron-down" size={16} color={colors.primaryLight} />
              <Text style={styles.fieldLabel}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectContainer}>
              {field.options?.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    field.value === option.value && styles.selectOptionSelected
                  ]}
                  onPress={() => field.onChange(option.value)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.selectOptionText,
                    field.value === option.value && styles.selectOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case "toggle":
        return (
          <View key={field.name} style={styles.fieldContainer}>
            <View style={styles.toggleRow}>
              <View style={styles.fieldHeader}>
                <Ionicons name="toggle" size={16} color={colors.primaryLight} />
                <Text style={styles.fieldLabel}>
                  {field.label} {field.required && <Text style={styles.required}>*</Text>}
                </Text>
              </View>
              <Switch
                value={field.value}
                onValueChange={field.onChange}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={field.value ? colors.primary : colors.text.secondary}
                disabled={loading}
              />
            </View>
            {field.options && (
              <Text style={styles.toggleDescription}>
                {field.value ? field.options[0]?.label : field.options[1]?.label}
              </Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Ionicons name={icon as any} size={24} color={colors.text.inverse} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onCancel}
            disabled={loading}
          >
            <Ionicons name="close" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Form Content */}
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {sections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name={section.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>

              <View style={styles.sectionContent}>
                {section.fields.map(field => renderField(field))}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <Ionicons name="hourglass" size={18} color={colors.text.inverse} />
            ) : (
              <Ionicons name={isEditing ? "checkmark" : "add"} size={18} color={colors.text.inverse} />
            )}
            <Text style={styles.saveButtonText}>
              {loading ? "Guardando..." : (isEditing ? "Actualizar" : "Crear")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  required: {
    color: colors.error,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  selectContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  selectOption: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectOptionText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  selectOptionTextSelected: {
    color: colors.text.inverse,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: colors.text.tertiary,
  },
  saveButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AdminFormModal;
