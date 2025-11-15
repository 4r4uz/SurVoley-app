import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../core/auth/AuthContext";
import LoadingScreen from "../shared/components/LoadingScreen";

export default function RootLayout() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaProvider>
        <LoadingScreen message="Cargando..." />
      </SafeAreaProvider>
    );
  }

  // Renderizar las rutas hijas sin redirecciones automáticas
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}
