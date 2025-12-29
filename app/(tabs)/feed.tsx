import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopBar } from '@/ui';
import { tokens } from '@/ui/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { shipApi } from '@/api/ships';
import { NotificationFeed } from '@/components/notifications/NotificationFeed';

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
      <NotificationFeed />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
});
