import { Slot } from "expo-router";
import { useAuth } from "../core/auth/AuthContext";
import LoadingScreen from "../shared/components/LoadingScreen";

export default function RootLayout() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Cargando..." />;
  }

  // Renderizar las rutas hijas sin redirecciones automáticas
  return <Slot />;
}
