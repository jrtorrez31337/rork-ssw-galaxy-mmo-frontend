import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { User, Ship, LogOut, Plus, Package } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { characterApi } from '@/api/characters';
import { shipApi } from '@/api/ships';
import Colors from '@/constants/colors';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profileId, logout } = useAuth();

  const { data: characters, isLoading: loadingCharacters } = useQuery({
    queryKey: ['characters', profileId],
    queryFn: () => characterApi.getByProfile(profileId!),
    enabled: !!profileId,
  });

  const { data: ships, isLoading: loadingShips } = useQuery({
    queryKey: ['ships', profileId],
    queryFn: () => shipApi.getByOwner(profileId!),
    enabled: !!profileId,
  });

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.displayName}>{user?.display_name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={24} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <User size={24} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Characters</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/character-create')}
            >
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.addButtonText}>New</Text>
            </TouchableOpacity>
          </View>

          {loadingCharacters ? (
            <Text style={styles.loadingText}>Loading characters...</Text>
          ) : characters && characters.length > 0 ? (
            <View style={styles.cardList}>
              {characters.map((character) => (
                <View key={character.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{character.name}</Text>
                  <Text style={styles.cardSubtitle}>
                    Sector: {character.home_sector}
                  </Text>
                  <View style={styles.attributesGrid}>
                    <View style={styles.attributeItem}>
                      <Text style={styles.attributeLabel}>Piloting</Text>
                      <Text style={styles.attributeValue}>
                        {character.attributes.piloting}
                      </Text>
                    </View>
                    <View style={styles.attributeItem}>
                      <Text style={styles.attributeLabel}>Engineering</Text>
                      <Text style={styles.attributeValue}>
                        {character.attributes.engineering}
                      </Text>
                    </View>
                    <View style={styles.attributeItem}>
                      <Text style={styles.attributeLabel}>Science</Text>
                      <Text style={styles.attributeValue}>
                        {character.attributes.science}
                      </Text>
                    </View>
                    <View style={styles.attributeItem}>
                      <Text style={styles.attributeLabel}>Tactics</Text>
                      <Text style={styles.attributeValue}>
                        {character.attributes.tactics}
                      </Text>
                    </View>
                    <View style={styles.attributeItem}>
                      <Text style={styles.attributeLabel}>Leadership</Text>
                      <Text style={styles.attributeValue}>
                        {character.attributes.leadership}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No characters yet</Text>
              <Text style={styles.emptySubtext}>Create your first character to start your journey</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ship size={24} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Ships</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/ship-customize')}
            >
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.addButtonText}>New</Text>
            </TouchableOpacity>
          </View>

          {loadingShips ? (
            <Text style={styles.loadingText}>Loading ships...</Text>
          ) : ships && ships.length > 0 ? (
            <View style={styles.cardList}>
              {ships.map((ship) => (
                <View key={ship.id} style={styles.card}>
                  <View style={styles.shipHeader}>
                    <Text style={styles.cardTitle}>{ship.name || 'Unnamed Ship'}</Text>
                    <View style={styles.shipTypeBadge}>
                      <Text style={styles.shipTypeText}>{ship.ship_type}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    Location: {ship.location_sector}
                  </Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Hull</Text>
                      <Text style={styles.statValue}>
                        {ship.hull_points}/{ship.hull_max}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Shield</Text>
                      <Text style={styles.statValue}>
                        {ship.shield_points}/{ship.shield_max}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Cargo</Text>
                      <Text style={styles.statValue}>{ship.cargo_capacity}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.inventoryButton}
                    onPress={() => router.push({ pathname: '/ship-inventory' as any, params: { shipId: ship.id } })}
                  >
                    <Package size={16} color={Colors.primary} />
                    <Text style={styles.inventoryButtonText}>View Inventory</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No ships yet</Text>
              <Text style={styles.emptySubtext}>Customize your first ship to explore the galaxy</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  loadingText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: 24,
  },
  cardList: {
    gap: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attributeItem: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attributeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  attributeValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  shipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shipTypeBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shipTypeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textDim,
    textAlign: 'center',
  },
  inventoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  inventoryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
