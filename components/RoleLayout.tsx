import { Stack, Redirect } from "expo-router";
import { useAuth } from "../types/use.auth";
import SafeLayout from "./safearea";
import LoadingScreen from "./LoadingScreen";

interface RoleLayoutProps {
  allowedRole: "admin" | "jugador" | "apoderado" | "entrenador";
}

export default function RoleLayout({ allowedRole }: RoleLayoutProps) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <SafeLayout>
        <LoadingScreen message="Cargando..." />
      </SafeLayout>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (user?.rol !== allowedRole) return <Redirect href="/(auth)/login" />;

  return (
    <SafeLayout>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </SafeLayout>
  );
}

