import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
// import MapView, {Marker, Polyline} from 'react-native-maps'; // Temporarily disabled for Expo Go
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {getVehicles, getLatestVehicleLocations, sendVehicleCommand} from '../../services/vehicleService';
import type {Vehicle, VehicleLocation} from '../../types';
import {MaterialIcons as Icon} from '@expo/vector-icons';

export default function VehicleTrackingScreen() {
  const {user, userType} = useAuth();
  const {theme} = useTheme();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<VehicleLocation[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const companyId = userType === 'company' ? user.id : (user as any).company_id;
      const vehiclesData = await getVehicles(companyId);
      const locationsData = await getLatestVehicleLocations(companyId);
      
      setVehicles(vehiclesData);
      setLocations(locationsData);

      // Update map region to show all vehicles
      if (locationsData.length > 0) {
        const lats = locationsData.map(l => l.latitude);
        const lngs = locationsData.map(l => l.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        setMapRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max(maxLat - minLat, 0.01) * 1.5,
          longitudeDelta: Math.max(maxLng - minLng, 0.01) * 1.5,
        });
      }
    } catch (error) {
      console.error('Error loading vehicle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopVehicle = async (vehicle: Vehicle) => {
    Alert.alert(
      'Stop Vehicle',
      `Are you sure you want to stop ${vehicle.name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            const result = await sendVehicleCommand(vehicle.id, 'stop');
            if (result) {
              Alert.alert('Success', 'Stop command sent to vehicle');
            } else {
              Alert.alert('Error', 'Failed to send command');
            }
          },
        },
      ],
    );
  };

  const getVehicleLocation = (vehicleId: string): VehicleLocation | undefined => {
    return locations.find(l => l.vehicle_id === vehicleId);
  };

  const getVehicleTypeIcon = (type: string) => {
    switch (type) {
      case 'truck':
        return 'local-shipping';
      case 'van':
        return 'airport-shuttle';
      case 'motorcycle':
        return 'two-wheeler';
      default:
        return 'directions-car';
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.mapPlaceholder}>
        <Icon name="map" size={48} color={theme.colors.gray400} />
        <Text style={[styles.mapPlaceholderText, {color: theme.colors.textSecondary}]}>
          Map view requires development build
        </Text>
        <Text style={[styles.mapPlaceholderSubtext, {color: theme.colors.textSecondary}]}>
          Run: npx expo prebuild && npx expo run:ios
        </Text>
      </View>

      <ScrollView
        style={styles.vehicleList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} tintColor={theme.colors.primary} />
        }>
        {vehicles.map(vehicle => {
          const location = getVehicleLocation(vehicle.id);
          return (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor:
                    selectedVehicle?.id === vehicle.id ? theme.colors.primary : theme.colors.gray200,
                },
              ]}
              onPress={() => setSelectedVehicle(vehicle)}>
              <View style={styles.vehicleHeader}>
                <Icon
                  name={getVehicleTypeIcon(vehicle.vehicle_type)}
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={[styles.vehicleName, {color: theme.colors.text}]}>
                  {vehicle.name}
                </Text>
                {location && (
                  <View style={[styles.statusDot, {backgroundColor: theme.colors.success}]} />
                )}
              </View>
              {location && (
                <>
                  <Text style={[styles.vehicleInfo, {color: theme.colors.textSecondary}]}>
                    Speed: {location.speed || 0} km/h
                  </Text>
                  <Text style={[styles.vehicleInfo, {color: theme.colors.textSecondary}]}>
                    Last seen: {new Date(location.timestamp).toLocaleString()}
                  </Text>
                </>
              )}
              <TouchableOpacity
                style={[styles.stopButton, {backgroundColor: theme.colors.error}]}
                onPress={() => handleStopVehicle(vehicle)}>
                <Icon name="stop" size={20} color="#FFFFFF" />
                <Text style={styles.stopButtonText}>Stop Vehicle</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholderText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  mapPlaceholderSubtext: {
    marginTop: 8,
    fontSize: 12,
  },
  vehicleList: {
    maxHeight: 300,
    backgroundColor: 'transparent',
  },
  vehicleCard: {
    padding: 16,
    margin: 8,
    borderRadius: 12,
    borderWidth: 2,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  vehicleInfo: {
    fontSize: 14,
    marginTop: 4,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

