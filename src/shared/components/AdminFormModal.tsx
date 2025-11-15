import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/theme";

const { width } = Dimensions.get("window");

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'toggle';
  value: any;
  onChange: (value: any) => void;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: any }[];
  icon?: string;
}

export interface FormSection {
  title: string;
  icon: string;
  fields: FormField[];
}

export interface AdminFormModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  icon: string;
  sections: FormSection[];
  onSave: () => void;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
  saveButtonText?: string;
  cancelButtonText?: string;
}

export default function AdminFormModal({
  visible,
  title,
  subtitle,
  icon,
  sections,
  onSave,
  onCancel,
  isEditing = false,
  loading = false,
  saveButtonText,
  cancelButtonText = "Cancelar",
}: AdminFormModalProps) {
  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <View key={field.name} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={styles.inputContainer}>
              {field.icon && (
                <Ionicons
                  name={field.icon as any}
                  size={18}
                  color="#9CA3AF"
                  style={styles.inputIcon}
                />
              )}
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={field.onChange}
                placeholder={field.placeholder}
                placeholderTextColor="#9CA3AF"
                keyboardType={field.type === 'email' ? 'email-address' : 'default'}
                autoCapitalize={field.type === 'email' ? 'none' : 'words'}
              />
            </View>
          </View>
        );

      case 'select':
        return (
          <View key={field.name} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={styles.selectGrid}>
              {field.options?.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    field.value === option.value && styles.selectOptionSelected
                  ]}
                  onPress={() => field.onChange(option.value)}
                >
                  <Text style={[
                    styles.selectOptionText,
                    field.value === option.value && styles.selectOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'toggle':
        return (
          <View key={field.name} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={styles.toggleContainer}>
              {field.options?.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.toggleOption,
                    field.value === option.value && styles.toggleOptionActive
                  ]}
                  onPress={() => field.onChange(option.value)}
                >
                  {option.value === true && (
                    <Ionicons name="checkmark-circle" size={16} color={field.value === true ? "#FFFFFF" : "#10B981"} />
                  )}
                  {option.value === false && (
                    <Ionicons name="close-circle" size={16} color={field.value === false ? "#FFFFFF" : "#EF4444"} />
                  )}
                  <Text style={[
                    styles.toggleText,
                    field.value === option.value && styles.toggleTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View>
                  <Text style={styles.modalTitle}>{title}</Text>
                  {subtitle && <Text style={styles.modalSubtitle}>{subtitle}</Text>}
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onCancel}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {sections.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name={section.icon as any} size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  </View>

                  {section.fields.map((field) => renderField(field))}
                </View>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                disabled={loading}
              >
                <Ionicons name="close" size={18} color="#6B7280" />
                <Text style={styles.cancelButtonText}>{cancelButtonText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={onSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name={isEditing ? "checkmark" : "save"} size={18} color="#FFFFFF" />
                )}
                <Text style={styles.saveButtonText}>
                  {saveButtonText || (isEditing ? "Guardar Cambios" : "Crear")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "95%",
    minHeight: "90%",
  },
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  closeButton: {
    position: "absolute",
    top: 24,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    flex: 1,
    padding: 24,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1F2937",
  },
  selectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  selectOption: {
    flex: 1,
    minWidth: (width - 48 - 12) / 2,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    alignItems: "center",
  },
  selectOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  selectOptionTextSelected: {
    color: "#FFFFFF",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
  },
  toggleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  toggleOptionActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  toggleTextActive: {
    color: "#1F2937",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
