import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../types/use.auth';

export default function JugadorLayout() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.rol !== 'jugador') {
    const routeMap = {
      admin: '/(admin)',
      apoderado: '/(apoderado)',
      entrenador: '/(entrenador)'
    };
    return <Redirect href={routeMap[user?.rol as keyof typeof routeMap] || '/(auth)/login'} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="asistencia" />
    </Stack>
  );
}