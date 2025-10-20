import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../types/use.auth";
import { View, Text, ActivityIndicator } from "react-native";
import SafeLayout from "../../components/safearea";

export default function AuthLayout() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <SafeLayout>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#3f3db8ff" />
          <Text style={{ marginTop: 10 }}>Cargando...</Text>
        </View>
      </SafeLayout>
    );
  }

  if (isAuthenticated) {
    const routeMap = {
      admin: "/(admin)",
      jugador: "/(jugador)",
      apoderado: "/(apoderado)",
      entrenador: "/(entrenador)",
    };
    return (
      <Redirect
        href={routeMap[user?.rol as keyof typeof routeMap] || "/(jugador)"}
      />
    );
  }

  return (
    <SafeLayout
      backgroundColor="#f8fafc"
      headerBackgroundColor="#3f3db8ff"
      edges={["right", "left"]}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
      </Stack>
    </SafeLayout>
  );
}
