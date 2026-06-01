// Powered by OnSpace.AI
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { ItemsProvider } from '@/contexts/ItemsContext';
import { useEffect } from 'react';
import { initNotifications } from '@/services/notificationService';

function NotificationInitializer() {
  useEffect(() => {
    initNotifications();
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <ItemsProvider>
          <NotificationInitializer />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="item/[id]"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
          </Stack>
        </ItemsProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
