import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useAuth } from "../core/auth/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SafeLayout from "../shared/components/SafeLayout";
import RoleBadge from "../shared/components/RoleBadge";
import { colors, spacing, borderRadius, shadows, typography } from "../shared/constants/theme";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const getRoleName = (role: string) => {
    const roles: { [key: string]: string } = {
      admin: "Administrador",
      jugador: "Jugador",
      entrenador: "Entrenador",
      apoderado: "Apoderado",
    };
    return roles[role] || "Usuario";
  };

  const handleSignOut = async () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            // Pequeño delay para asegurar que el estado se actualice
            setTimeout(() => {
              router.replace("/login");
            }, 100);
          } catch (error) {
            console.error("Error al cerrar sesión:", error);
            Alert.alert("Error", "No se pudo cerrar la sesión");
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    Alert.alert("Editar Perfil", "Funcionalidad en desarrollo");
  };

  const handleContactEmail = () => {
    Linking.openURL(
      "mailto:admin@clubdeportivo.com?subject=Consulta%20desde%20la%20App"
    );
  };

  const handleContactPhone = () => {
    Linking.openURL("tel:+56912345678");
  };

  const baseSettingsSections = [
    {
      title: "Cuenta",
      icon: "person",
      items: [
        {
          title: "Información Personal",
          subtitle: "Actualiza tus datos personales",
          icon: "person-circle",
          action: handleEditProfile,
        },
        {
          title: "Cambiar Contraseña",
          subtitle: "Actualiza tu contraseña de acceso",
          icon: "lock-closed",
          action: () =>
            Alert.alert("Cambiar Contraseña", "Funcionalidad en desarrollo"),
        },
      ],
    },
    {
      title: "Contacto",
      icon: "chatbubble-ellipses",
      items: [
        {
          title: "Email de Administración",
          subtitle: "admin@survoley.cl",
          icon: "mail",
          action: handleContactEmail,
        },
        {
          title: "Teléfono de Contacto",
          subtitle: "+56 9 1234 5678",
          icon: "call",
          action: handleContactPhone,
        },
      ],
    },
  ];

  const allSettingsSections = [
    ...baseSettingsSections,
  ];

  return (
    <SafeLayout>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.nombre?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
              {user?.apellido?.charAt(0)}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.nombre
                ? `${user.nombre} ${user.apellido || ""}`
                : user?.email}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.rol && <RoleBadge rol={user.rol} size="sm" />}
          </View>
        </View>

        {allSettingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name={section.icon as any}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.settingItem}
                  onPress={item.action}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIcon}>
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      <Text style={styles.settingSubtitle}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.settingRight}>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Ionicons name="log-out" size={20} color="#dc3545" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>SURVOLEY APP v1.0.0</Text>
          <Text style={styles.appCopyright}>
            © 2024 Club Deportivo. Todos los derechos reservados
          </Text>
        </View>
      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  userHeader: {
    backgroundColor: colors.background,
    padding: spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.lg,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text.inverse,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    marginBottom: 2,
  },
  userEmail: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
  },
  sectionContent: {
    backgroundColor: colors.background,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    ...shadows.sm,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  settingRight: {
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 25,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    ...typography.label,
    fontSize: 16,
    color: colors.error,
  },
  appInfo: {
    alignItems: "center",
    padding: 25,
    paddingBottom: 35,
  },
  appVersion: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: "#999",
  },
});
