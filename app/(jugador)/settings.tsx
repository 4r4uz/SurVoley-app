import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useAuth } from "../../types/use.auth";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleSignOut = async () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/login");
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

  const settingsSections = [
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
      title: "Notificaciones",
      icon: "notifications",
      items: [
        {
          title: "Notificaciones",
          subtitle: "Recibir notificaciones en el dispositivo",
          icon: "phone-portrait",
          type: "switch",
          value: notifications,
          onValueChange: setNotifications,
        },
        {
          title: "Actualizaciones por Email",
          subtitle: "Recibir novedades por correo electrónico",
          icon: "mail",
          type: "switch",
          value: emailUpdates,
          onValueChange: setEmailUpdates,
        },
      ],
    },
    {
      title: "Preferencias",
      icon: "settings",
      items: [
        {
          title: "Modo Oscuro",
          subtitle: "Activar interfaz en modo oscuro",
          icon: "moon",
          type: "switch",
          value: darkMode,
          onValueChange: setDarkMode,
        },
        {
          title: "Privacidad",
          subtitle: "Configuración de privacidad y datos",
          icon: "shield-checkmark",
          action: () =>
            Alert.alert("Privacidad", "Funcionalidad en desarrollo"),
        },
      ],
    },
    {
      title: "Soporte",
      icon: "help-buoy",
      items: [
        {
          title: "Centro de Ayuda",
          subtitle: "Preguntas frecuentes y soporte",
          icon: "help-circle",
          action: () =>
            Alert.alert("Centro de Ayuda", "Funcionalidad en desarrollo"),
        },
        {
          title: "Reportar Problema",
          subtitle: "Informar sobre un error o problema",
          icon: "bug",
          action: () =>
            Alert.alert("Reportar Problema", "Funcionalidad en desarrollo"),
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header de Usuario */}
      <View style={styles.userHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.nombre?.charAt(0)}
            {user?.apellido?.charAt(0)}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.nombre} {user?.apellido}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="person" size={12} color="#fff" />
            <Text style={styles.roleText}>Jugador</Text>
          </View>
        </View>
      </View>

      {/* Secciones de Configuración */}
      {settingsSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name={section.icon as any} size={20} color="#3f3db8ff" />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>

          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.settingItem}
                onPress={item.action}
                disabled={item.type === "switch"}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIcon}>
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color="#3f3db8ff"
                    />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>

                <View style={styles.settingRight}>
                  {item.type === "switch" ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{
                        false: "#f0f0f0",
                        true: "rgba(63, 61, 184, 0.3)",
                      }}
                      thumbColor={item.value ? "#3f3db8ff" : "#f4f3f4"}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Botón de Cerrar Sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Ionicons name="log-out" size={20} color="#dc3545" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Información de la App */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>SURVOLEY APP v0.00000000001</Text>
        <Text style={styles.appCopyright}>
          © 2024 Todos los derechos reservados
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  userHeader: {
    backgroundColor: "#fff",
    padding: 25,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#3f3db8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(63, 61, 184, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    color: "#3f3db8ff",
    fontWeight: "600",
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  sectionContent: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
    borderRadius: 8,
    backgroundColor: "rgba(63, 61, 184, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#dc3545",
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
