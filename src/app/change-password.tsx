import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../core/supabase/supabaseClient";
import { useAuth } from "../core/auth/AuthContext";
import SafeLayout from "../shared/components/SafeLayout";
import { colors, spacing, borderRadius, typography } from "../shared/constants/theme";

interface PasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PasswordForm>({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const handleInputChange = (field: keyof PasswordForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    if (!formData.newPassword.trim()) {
      Alert.alert("Error", "La nueva contraseña es obligatoria");
      return false;
    }
    if (formData.newPassword.length < 6) {
      Alert.alert("Error", "La nueva contraseña debe tener al menos 6 caracteres");
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log("Intentando cambiar contraseña...");

      // Actualizar la contraseña directamente en la tabla Usuarios
      const { error: updateError } = await supabase
        .from("Usuarios")
        .update({ password: formData.newPassword })
        .eq("id_usuario", user?.id);

      if (updateError) {
        console.error("Error actualizando contraseña:", updateError);
        throw updateError;
      }

      console.log("Contraseña cambiada exitosamente");
      Alert.alert(
        "Éxito",
        "Tu contraseña ha sido cambiada correctamente",
        [
          {
            text: "OK",
            onPress: () => {
              // Limpiar el formulario
              setFormData({
                newPassword: "",
                confirmPassword: "",
              });
              router.back();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error("Error cambiando contraseña:", error);
      Alert.alert("Error", "No se pudo cambiar la contraseña. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const formFields = [
    {
      key: "newPassword",
      label: "Nueva Contraseña",
      placeholder: "Ingresa tu nueva contraseña",
      icon: "lock-open",
      secureTextEntry: true,
      required: true,
    },
    {
      key: "confirmPassword",
      label: "Confirmar Nueva Contraseña",
      placeholder: "Confirma tu nueva contraseña",
      icon: "lock-open",
      secureTextEntry: true,
      required: true,
    },
  ];

  return (
    <SafeLayout>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Tu contraseña debe tener al menos 6 caracteres.
          </Text>
        </View>

        <View style={styles.form}>
          {formFields.map((field) => (
            <View key={field.key} style={styles.inputGroup}>
              <Text style={styles.label}>
                {field.label}
                {field.required && <Text style={styles.required}> *</Text>}
              </Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons
                    name={field.icon as any}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  value={formData[field.key as keyof PasswordForm]}
                  onChangeText={(value) => handleInputChange(field.key as keyof PasswordForm, value)}
                  secureTextEntry={!showPasswords[field.key as keyof typeof showPasswords]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => togglePasswordVisibility(field.key as keyof typeof showPasswords)}
                >
                  <Ionicons
                    name={showPasswords[field.key as keyof typeof showPasswords] ? "eye-off" : "eye"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="key" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Cambiar Contraseña</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 16,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.primary + "10",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  inputIcon: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary + "10",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1F2937",
  },
  eyeIcon: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 16,
  },
  actions: {
    padding: 20,
    paddingBottom: 40,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    padding: 16,
  },
  cancelButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
