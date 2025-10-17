import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../types/use.auth';

export default function AuthLayout() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    const routeMap = {
      admin: '/(admin)',
      jugador: '/(jugador)',
      apoderado: '/(apoderado)',
      entrenador: '/(entrenador)'
    };
    return <Redirect href={routeMap[user?.rol as keyof typeof routeMap] || '/(jugador)'} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}