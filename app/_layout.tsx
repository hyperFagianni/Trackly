import 'react-native-gesture-handler';
import '../src/background/backgroundTask';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerBackgroundSyncAsync } from '../src/background/backgroundTask';
import { getDatabase } from '../src/db/database';
import { ensureNotificationChannel } from '../src/notifications/notificationService';
import { colors } from '../src/theme/theme';

export default function RootLayout() {
  useEffect(() => {
    getDatabase().catch((error) => console.warn('Inizializzazione database fallita:', error));
    ensureNotificationChannel().catch((error) => console.warn('Configurazione canale notifiche fallita:', error));
    registerBackgroundSyncAsync().catch((error) => console.warn('Registrazione task in background fallita:', error));
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.backgroundTop },
            headerTitleStyle: { color: colors.textPrimary },
            contentStyle: { backgroundColor: colors.backgroundTop },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Trackly' }} />
          <Stack.Screen
            name="add"
            options={{ title: 'Nuova spedizione', presentation: 'modal' }}
          />
          <Stack.Screen name="shipment/[id]" options={{ title: 'Dettaglio spedizione' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
