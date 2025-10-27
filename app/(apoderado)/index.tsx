import React from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useAuth } from "../../types/use.auth";
import { useRouter } from "expo-router";

export default function ApoderadoHome() {
  const { user, signOut } = useAuth();
  const router = useRouter();

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido, {user?.name || "Apoderado"}</Text>
      <Text style={styles.subtitle}>Selecciona una opción:</Text>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => router.push("/(apoderado)/horarios")}
      >
        <Text style={styles.menuText}>📅 Ver Horarios</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => router.push("/(apoderado)/asistencia")}
      >
        <Text style={styles.menuText}>✅ Asistencia</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => router.push("/(apoderado)/pagos")}
      >
        <Text style={styles.menuText}>💳 Pago Mensual</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  menuButton: {
    width: "80%",
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
  },
  menuText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: "#d9534f",
    padding: 14,
    borderRadius: 10,
    width: "60%",
    alignItems: "center",
  },
});
