// Powered by OnSpace.AI
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { ItemsProvider } from '@/contexts/ItemsContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <ItemsProvider>
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
