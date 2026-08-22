import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

// react-native-web's Alert.alert() is a no-op, so confirmations relying on it
// never invoke their callbacks on web. This falls back to window.confirm there.
export function confirmAction(options: ConfirmOptions, onConfirm: () => void, onCancel?: () => void) {
  const { title, message, confirmLabel = 'OK', cancelLabel = 'Annulla', destructive } = options;

  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof window !== 'undefined' && window.confirm(text)) {
      onConfirm();
    } else {
      onCancel?.();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel', onPress: onCancel },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
