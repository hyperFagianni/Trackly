import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARRIERS, isApiCarrier } from '../src/config/carriers';
import { STATUS_META } from '../src/config/statusMeta';
import { GlassCard } from '../src/components/GlassCard';
import { colors, radii, spacing, typography } from '../src/theme/theme';

function Section({ icon, title, children }: { icon: keyof typeof Ionicons.glyphMap; title: string; children: React.ReactNode }) {
  return (
    <GlassCard contentStyle={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={colors.accent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </GlassCard>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

export default function InfoScreen() {
  return (
    <View style={styles.flex}>
      <LinearGradient colors={[colors.backgroundTop, colors.backgroundBottom]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section icon="cube-outline" title="Cos'è Trackly">
          <P>
            Trackly raccoglie in un'unica home tutte le tue spedizioni, anche di corrieri diversi, così non devi
            più aprire un sito o un'app per ognuno.
          </P>
        </Section>

        <Section icon="add-circle-outline" title="Aggiungere una spedizione">
          <P>
            Tocca “+” in alto a destra, inserisci il numero di tracking e scegli il corriere dall'elenco. Puoi
            anche dare un nome alla spedizione (es. “Scarpe nuove”) per riconoscerla più facilmente.
          </P>
        </Section>

        <Section icon="hand-left-outline" title="Gesture sulla home">
          <P>
            <Text style={styles.bold}>Scorri verso destra</Text> su una spedizione per rivelare il cestino ed
            eliminarla (con conferma).
          </P>
          <P>
            <Text style={styles.bold}>Scorri verso sinistra</Text> per rivelare la campanella e attivare o
            disattivare le notifiche per quella spedizione — disponibile solo per i corrieri con tracking live
            (vedi sotto).
          </P>
        </Section>

        <Section icon="git-compare-outline" title="Due tipi di corriere">
          <P>
            <Text style={styles.bold}>Tracking live:</Text> UPS, FedEx e DHL offrono un'API di tracciamento
            gratuita senza bisogno di un contratto business. Per queste spedizioni Trackly mostra lo stato
            aggiornato e le notifiche automatiche.
          </P>
          <P>
            <Text style={styles.bold}>Link al sito:</Text> gli altri corrieri della lista (tra cui Poste
            Italiane, BRT, GLS, SDA) non offrono un'API gratuita senza un contratto commerciale col corriere.
            Per queste spedizioni Trackly le tiene comunque organizzate nella tua lista, ma aprendole troverai un
            pulsante che copia il numero di tracking e apre la pagina ufficiale del corriere per vedere lo stato
            — niente stato live né notifiche automatiche in questo caso.
          </P>
        </Section>

        <Section icon="flag-outline" title="Stati di una spedizione (tracking live)">
          {Object.values(STATUS_META).map((meta) => (
            <View key={meta.label} style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
              <Text style={styles.statusLabel}>{meta.label}</Text>
            </View>
          ))}
        </Section>

        <Section icon="notifications-outline" title="Notifiche">
          <P>
            Le notifiche sono generate sul telefono stesso (nessun server esterno che le invia). L'app controlla
            periodicamente lo stato delle spedizioni con le notifiche attive, anche quando è chiusa.
          </P>
          <P>
            Il sistema operativo decide quando far partire questo controllo: non è istantaneo, può volerci da
            qualche minuto a qualche ora. Su iPhone, quando l'app è installata tramite Expo Go, il controllo a
            app chiusa potrebbe non avvenire affatto — apri l'app o trascina verso il basso nella home per
            aggiornare subito.
          </P>
        </Section>

        <Section icon="refresh-outline" title="Aggiornare manualmente">
          <P>
            Trascina verso il basso nella home, oppure apri una spedizione e trascina verso il basso lì, per
            forzare subito un controllo dello stato.
          </P>
        </Section>

        <Section icon="lock-closed-outline" title="I tuoi dati">
          <P>
            Le spedizioni che aggiungi restano solo sul tuo dispositivo (nessun account, nessun account cloud
            associato). Non c'è pubblicità in questa versione dell'app.
          </P>
        </Section>

        <Section icon="business-outline" title="Corrieri supportati">
          <Text style={styles.subheading}>Tracking live</Text>
          <P>{CARRIERS.filter(isApiCarrier).map((carrier) => carrier.name).join(' · ')}</P>
          <Text style={[styles.subheading, styles.spaced]}>Link al sito ufficiale</Text>
          <P>{CARRIERS.filter((carrier) => !isApiCarrier(carrier)).map((carrier) => carrier.name).join(' · ')}</P>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  sectionBody: {
    gap: spacing.xs,
  },
  paragraph: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subheading: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  spaced: {
    marginTop: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  statusLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
