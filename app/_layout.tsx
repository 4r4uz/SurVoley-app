import { Stack } from 'expo-router';
import { useAuth } from '../types/use.auth';
import { View, Text, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3f3db8ff" />
        <Text style={{ marginTop: 10 }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(jugador)" />
      <Stack.Screen name="(apoderado)" />
      <Stack.Screen name="(entrenador)" />
    </Stack>
  );
}