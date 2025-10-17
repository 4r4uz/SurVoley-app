import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../types/use.auth';

export default function EntrenadorLayout() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.rol !== 'entrenador') {
    const routeMap = {
      admin: '/(admin)',
      jugador: '/(jugador)',
      apoderado: '/(apoderado)'
    };
    return <Redirect href={routeMap[user?.rol as keyof typeof routeMap] || '/(auth)/login'} />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}