import React, { useState, useEffect } from "react";
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
import { useAuth } from "../core/auth/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../core/supabase/supabaseClient";
import SafeLayout from "../shared/components/SafeLayout";
import { colors, spacing, borderRadius, typography } from "../shared/constants/theme";

interface UserProfile {
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
}



export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<UserProfile>({
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        correo: user.email || "",
        telefono: user.telefono || "",
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };



  const validateForm = () => {
    if (!formData.nombre.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return false;
    }
    if (!formData.apellido.trim()) {
      Alert.alert("Error", "El apellido es obligatorio");
      return false;
    }
    if (!formData.correo.trim()) {
      Alert.alert("Error", "El correo es obligatorio");
      return false;
    }
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      Alert.alert("Error", "El formato del correo no es válido");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Primero actualizar la tabla Usuarios (datos básicos)
      const userUpdateData = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        correo: formData.correo.trim(),
      };

      const { error: userError } = await supabase
        .from("Usuarios")
        .update(userUpdateData)
        .eq("id_usuario", user?.id);

      if (userError) throw userError;

      // Luego actualizar campos específicos en la tabla del rol si existen
      let roleUpdateData: any = {};
      let tableName = "";
      let idField = "";

      // Solo agregar campos que existen en las tablas específicas
      if (formData.telefono?.trim()) {
        roleUpdateData.telefono = formData.telefono.trim();
      }

      // Solo actualizar si hay campos específicos para actualizar
      if (Object.keys(roleUpdateData).length > 0) {
        switch (user?.rol) {
          case "jugador":
            tableName = "Jugador";
            idField = "id_jugador";
            break;
          case "entrenador":
            tableName = "Entrenador";
            idField = "id_entrenador";
            break;
          case "apoderado":
            tableName = "Apoderado";
            idField = "id_apoderado";
            break;
          case "admin":
            // Admin ya se actualizó en Usuarios, no hay tabla específica
            break;
          default:
            throw new Error("Rol de usuario no reconocido");
        }

        if (tableName && idField) {
          const { error: roleError } = await supabase
            .from(tableName)
            .update(roleUpdateData)
            .eq(idField, user?.id);

          // No fallar si la tabla no tiene estas columnas, solo loggear
          if (roleError) {
            console.warn(`No se pudieron actualizar campos específicos en ${tableName}:`, roleError.message);
          }
        }
      }

      // Actualizar el contexto de autenticación
      await updateUser({
        ...user,
        ...userUpdateData,
        ...roleUpdateData,
      });

      Alert.alert(
        "Éxito",
        "Tu información personal ha sido actualizada correctamente",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      Alert.alert("Error", "No se pudo actualizar la información. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };



  const formFields = [
    {
      key: "nombre",
      label: "Nombre",
      placeholder: "Ingresa tu nombre",
      icon: "person",
      required: true,
    },
    {
      key: "apellido",
      label: "Apellido",
      placeholder: "Ingresa tu apellido",
      icon: "person",
      required: true,
    },
    {
      key: "correo",
      label: "Correo",
      placeholder: "Ingresa tu correo",
      icon: "mail",
      keyboardType: "email-address",
      required: true,
    },
    {
      key: "telefono",
      label: "Teléfono",
      placeholder: "Ingresa tu teléfono",
      icon: "call",
      keyboardType: "phone-pad",
    },
  ];

  if (loading) {
    return (
      <SafeLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
                  value={formData[field.key as keyof UserProfile] || ""}
                  onChangeText={(value) => handleInputChange(field.key as keyof UserProfile, value)}
                  keyboardType={field.keyboardType as any}
                  editable={field.key !== "correo"} // Correo no editable por ahora
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
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
    alignItems: "flex-start",
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
