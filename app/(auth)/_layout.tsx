import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../types/use.auth";
import { ROLE_ROUTE_MAP } from "../../types/auth.type";
import SafeLayout from "../../components/safearea";
import LoadingScreen from "../../components/LoadingScreen";

export default function AuthLayout() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <SafeLayout>
        <LoadingScreen message="Cargando..." />
      </SafeLayout>
    );
  }

  if (isAuthenticated && user?.rol) {
    return (
      <Redirect
        href={ROLE_ROUTE_MAP[user.rol] || ROLE_ROUTE_MAP.jugador}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
