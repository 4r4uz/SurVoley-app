import React from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useAuth } from "../../types/use.auth";
import { useRouter } from "expo-router";

export default function EntrenadorHome() {
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
            Alert.alert("Error", "No se pudo cerrar la sesión");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido Entrenador {user?.name || ""}</Text>
      <Text style={styles.subtitle}>Seleccione una opción:</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(entrenador)/asistencia")}
      >
        <Text style={styles.buttonText}>📋 Control de Asistencia</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(entrenador)/calendario")}
      >
        <Text style={styles.buttonText}>🗓️ Programar Entrenamientos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: "center", alignItems: "center",
    padding: 20, backgroundColor: "#f5f5f5",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 20 },
  button: {
    width: "80%", backgroundColor: "#007AFF",
    padding: 16, borderRadius: 12, alignItems: "center", marginVertical: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  logoutButton: {
    marginTop: 30, backgroundColor: "#d9534f",
    padding: 14, borderRadius: 10, width: "60%", alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "bold" },
});
