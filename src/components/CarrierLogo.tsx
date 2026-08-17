import { Image, StyleSheet, View } from 'react-native';
import { getCarrierById } from '../config/carriers';
import { colors } from '../theme/theme';

export function CarrierLogo({ carrierId, size = 44 }: { carrierId: string; size?: number }) {
  const carrier = getCarrierById(carrierId);
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 3 }]}>
      {carrier ? (
        <Image
          source={carrier.logo}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel={carrier.name}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
