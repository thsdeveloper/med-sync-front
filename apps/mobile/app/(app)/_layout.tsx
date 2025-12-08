import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/providers/auth-provider';
import { ActivityIndicator, View } from 'react-native';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="shift/[id]"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Detalhes da Escala',
        }}
      />
      <Stack.Screen
        name="swap/[id]"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Solicitação de Troca',
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          headerShown: true,
          title: 'Conversa',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: true,
          title: 'Meu Perfil',
        }}
      />
    </Stack>
  );
}
