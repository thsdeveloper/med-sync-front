import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
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

interface AddressDetailsCollapsibleProps {
  address: FacilityAddress;
}

export function AddressDetailsCollapsible({ address }: AddressDetailsCollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded((prev) => !prev);
  };

  const arrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: withTiming(isExpanded ? '180deg' : '0deg', { duration: 300 }) }],
    };
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggleExpand} activeOpacity={0.7}>
        <Text style={styles.headerText}>Ver endereço completo</Text>
        <Animated.View style={arrowStyle}>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </Animated.View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.detailsContainer}>
          <View style={styles.row}>
            <Text style={styles.detailLabel}>Rua:</Text>
            <Text style={styles.detailValue}>{address.street}, {address.number}</Text>
          </View>

          {address.complement && (
            <View style={styles.row}>
              <Text style={styles.detailLabel}>Complemento:</Text>
              <Text style={styles.detailValue}>{address.complement}</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.detailLabel}>Bairro:</Text>
            <Text style={styles.detailValue}>{address.neighborhood}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.detailLabel}>Cidade:</Text>
            <Text style={styles.detailValue}>{address.city} - {address.state}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.detailLabel}>CEP:</Text>
            <Text style={styles.detailValue}>{address.postal_code}</Text>
          </View>

          {address.latitude && address.longitude && (
            <View style={styles.coordsContainer}>
              <Ionicons name="locate" size={14} color="#9CA3AF" />
              <Text style={styles.coordsText}>
                {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 13,
    color: '#0066CC',
    fontWeight: '600',
  },
  detailsContainer: {
    paddingTop: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 6,
    minWidth: 100,
  },
  detailValue: {
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
  },
  coordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  coordsText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
