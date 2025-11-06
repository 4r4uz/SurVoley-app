import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../types/use.auth";
import LoadingScreen from "../components/LoadingScreen";

export default function RootLayout() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaProvider>
        <LoadingScreen message="Cargando..." />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(jugador)" />
        <Stack.Screen name="(apoderado)" />
        <Stack.Screen name="(entrenador)" />
      </Stack>
    </SafeAreaProvider>
  );
}
