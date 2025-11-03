import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../types/use.auth";
import { View, Text, ActivityIndicator } from "react-native";
import SafeLayout from "../../components/safearea";

export default function JugadorLayout() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <SafeLayout>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#3f3db8ff" />
          <Text style={{ marginTop: 10 }}>Cargando...</Text>
        </View>
      </SafeLayout>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (user?.rol !== "jugador") return <Redirect href="/(auth)/login" />;

  return (
    <SafeLayout>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </SafeLayout>
  );
}
