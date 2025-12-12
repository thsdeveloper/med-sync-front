import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type FacilityAddress = {
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
};

interface FacilityLocationActionsProps {
  facilityAddress?: FacilityAddress | null;
  fallbackAddress?: string | null;
  facilityName?: string;
}

export function FacilityLocationActions({
  facilityAddress,
  fallbackAddress,
  facilityName = 'Facility',
}: FacilityLocationActionsProps) {
  // Build formatted address string from structured data
  const getFormattedAddress = (): string | null => {
    if (facilityAddress) {
      const parts = [
        `${facilityAddress.street}, ${facilityAddress.number}`,
        facilityAddress.complement,
        facilityAddress.neighborhood,
        facilityAddress.city,
        facilityAddress.state,
        facilityAddress.postal_code,
      ].filter(Boolean);
      return parts.join(', ');
    }
    return fallbackAddress || null;
  };

  const hasCoordinates = facilityAddress?.latitude && facilityAddress?.longitude;
  const formattedAddress = getFormattedAddress();

  const openGoogleMaps = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let url: string;
    if (hasCoordinates) {
      url = `https://www.google.com/maps/search/?api=1&query=${facilityAddress!.latitude},${facilityAddress!.longitude}`;
    } else if (formattedAddress) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress)}`;
    } else {
      Alert.alert('Erro', 'Endereço não disponível');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o Google Maps');
      }
    } catch (error) {
      console.error('Error opening Google Maps:', error);
      Alert.alert('Erro', 'Não foi possível abrir o Google Maps');
    }
  };

  const openWaze = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let url: string;
    if (hasCoordinates) {
      url = `https://waze.com/ul?ll=${facilityAddress!.latitude},${facilityAddress!.longitude}&navigate=yes`;
    } else if (formattedAddress) {
      url = `https://waze.com/ul?q=${encodeURIComponent(formattedAddress)}&navigate=yes`;
    } else {
      Alert.alert('Erro', 'Endereço não disponível');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web version if app not installed
        const webUrl = url.replace('waze://', 'https://waze.com/');
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening Waze:', error);
      Alert.alert('Erro', 'Não foi possível abrir o Waze');
    }
  };

  const openAppleMaps = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let url: string;
    if (hasCoordinates) {
      url = `maps://?ll=${facilityAddress!.latitude},${facilityAddress!.longitude}`;
    } else if (formattedAddress) {
      url = `maps://?address=${encodeURIComponent(formattedAddress)}`;
    } else {
      Alert.alert('Erro', 'Endereço não disponível');
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Erro', 'Não foi possível abrir o Apple Maps');
        }
      } else {
        // On Android, fallback to Google Maps
        await openGoogleMaps();
      }
    } catch (error) {
      console.error('Error opening Apple Maps:', error);
      Alert.alert('Erro', 'Não foi possível abrir o Apple Maps');
    }
  };

  if (!formattedAddress && !hasCoordinates) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Abrir navegação em:</Text>
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.mapButton} onPress={openGoogleMaps}>
          <Ionicons name="navigate-circle" size={24} color="#4285F4" />
          <Text style={styles.buttonText}>Google Maps</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mapButton} onPress={openWaze}>
          <Ionicons name="navigate" size={24} color="#33CCFF" />
          <Text style={styles.buttonText}>Waze</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.mapButton} onPress={openAppleMaps}>
            <Ionicons name="map" size={24} color="#007AFF" />
            <Text style={styles.buttonText}>Apple Maps</Text>
          </TouchableOpacity>
        )}
      </View>
      {hasCoordinates && (
        <Text style={styles.coordinatesText}>
          <Ionicons name="location-sharp" size={12} color="#9CA3AF" />
          {' '}Coordenadas precisas disponíveis
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  buttonText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  coordinatesText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
