import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import { useAuth } from "../../core/auth/AuthContext";
import { colors } from "../constants/theme";
import LoadingScreen from "./LoadingScreen";
import SafeLayout from "./SafeLayout";

interface RoleLayoutProps {
  allowedRole: string;
}

//Componente layout que verifica permisos de rol antes de renderizar

export default function RoleLayout({ allowedRole }: RoleLayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verificando permisos..." />;
  }

  if (!user) {
    return (
      <SafeLayout>
        <View style={styles.container}>
          <Text style={styles.errorText}>Usuario no autenticado</Text>
        </View>
      </SafeLayout>
    );
  }

  if (user.rol !== allowedRole) {
    return (
      <SafeLayout>
        <View style={styles.container}>
          <Text style={styles.errorText}>
            No tienes permisos para acceder a esta sección
          </Text>
          <Text style={styles.subText}>
            Rol requerido: {allowedRole}
          </Text>
          <Text style={styles.subText}>
            Tu rol: {user.rol}
          </Text>
        </View>
      </SafeLayout>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "600",
  },
  subText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 5,
  },
});
