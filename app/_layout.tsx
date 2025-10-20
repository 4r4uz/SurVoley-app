import { Stack } from "expo-router";
import { useAuth } from "../types/use.auth";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeLayout from "../components/safearea";

export default function RootLayout() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeLayout>
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color="#3f3db8ff" />
            <Text style={{ marginTop: 10, color: "#374151" }}>Cargando...</Text>
          </View>
        </SafeLayout>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeLayout edges={["right", "left"]}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(jugador)" />
          <Stack.Screen name="(apoderado)" />
          <Stack.Screen name="(entrenador)" />
        </Stack>
      </SafeLayout>
    </SafeAreaProvider>
  );
}
