import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../core/auth/AuthContext";
import SafeLayout from "./SafeLayout";
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

  // Si no está autenticado, no renderizar nada para evitar conflictos con navegación manual
  if (!isAuthenticated) {
    return null;
  }

  // Si el rol no coincide, redirigir al login
  if (user?.rol !== allowedRole) {
    return <Redirect href="/login" />;
  }

  // Configurar rutas según el rol
  const getRoutesForRole = (role: string) => {
    switch (role) {
      case "admin":
        return [
          <Stack.Screen key="index" name="index" />,
          <Stack.Screen key="usuarios" name="usuarios" />,
          <Stack.Screen key="asistencias" name="asistencias" />,
          <Stack.Screen key="pagos" name="pagos" />,
          <Stack.Screen key="reportes" name="reportes" />,
          <Stack.Screen key="entrenamientos" name="entrenamientos" />,
        ];
      default:
        return [
          <Stack.Screen key="index" name="index" />,
          <Stack.Screen key="asistencia" name="asistencia" />,
          <Stack.Screen key="certificado" name="certificado" />,
          <Stack.Screen key="mensualidad" name="mensualidad" />,
        ];
    }
  };

  return (
    <SafeLayout>
      <Stack screenOptions={{ headerShown: false }}>
        {getRoutesForRole(allowedRole)}
      </Stack>
    </SafeLayout>
  );
}
