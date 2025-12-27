import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopBar, Text } from '@/ui';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';

export default function FeedTab() {
  const { user, profileId } = useAuth();

  const { data: ships } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const currentShip = ships?.[0] || null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar
        ship={currentShip}
        location={currentShip?.location_sector || 'Unknown'}
        dockedAt={currentShip?.docked_at}
        credits={parseFloat(user?.credits || '0')}
        quickActions={[]}
      />
      <View style={styles.content}>
        <Text variant="title" weight="bold" align="center">
          Activity Feed
        </Text>
        <Text variant="body" color={tokens.colors.text.secondary} align="center" style={styles.subtitle}>
          Real-time event log will be integrated here (currently SSE events show as Alerts)
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  subtitle: {
    marginTop: tokens.spacing[2],
  },
});
