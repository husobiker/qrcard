import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Share, Image, ActivityIndicator} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {MaterialIcons as Icon} from '@expo/vector-icons';
import {getEmployeeAnalytics, type AnalyticsData} from '../services/analyticsService';

interface QRCodeGeneratorProps {
  url: string;
  employeeName?: string;
  employeeId?: string;
}

export default function QRCodeGenerator({url, employeeName, employeeId}: QRCodeGeneratorProps) {
  const {theme} = useTheme();
  const [analytics, setAnalytics] = useState<AnalyticsData>({view_count: 0, click_count: 0});
  const [loading, setLoading] = useState(true);
  
  // Generate QR code using online API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

  useEffect(() => {
    if (employeeId) {
      loadAnalytics();
    } else {
      setLoading(false);
    }
  }, [employeeId]);

  const loadAnalytics = async () => {
    if (!employeeId) return;
    setLoading(true);
    const data = await getEmployeeAnalytics(employeeId);
    setAnalytics(data);
    setLoading(false);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${employeeName || 'QR Code'}\n${url}`,
        url: url,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.qrContainer, {backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200}]}>
        <Image source={{uri: qrCodeUrl}} style={styles.qrImage} resizeMode="contain" />
        {employeeName && (
          <Text style={[styles.employeeName, {color: theme.colors.text}]}>{employeeName}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.shareButton, {backgroundColor: theme.colors.primaryDark}]}
        onPress={handleShare}>
        <Icon name="share" size={20} color="#FFFFFF" />
        <Text style={styles.shareButtonText}>Paylaş</Text>
      </TouchableOpacity>
      <View style={[styles.urlContainer, {backgroundColor: theme.colors.gray200}]}>
        <Text style={[styles.urlLabel, {color: theme.colors.textSecondary}]}>Public URL:</Text>
        <Text style={[styles.urlText, {color: theme.colors.text}]} numberOfLines={2}>
          {url}
        </Text>
      </View>
      
      {employeeId && (
        <View style={[styles.analyticsContainer, {backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary + '40'}]}>
          <Text style={[styles.analyticsTitle, {color: theme.colors.primary}]}>İstatistikler</Text>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <View style={styles.analyticsRow}>
              <View style={styles.analyticsItem}>
                <Icon name="visibility" size={18} color={theme.colors.primary} />
                <Text style={[styles.analyticsText, {color: theme.colors.primary}]}>
                  <Text style={styles.analyticsBold}>{analytics.view_count}</Text> Görüntülenme
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Icon name="touch-app" size={18} color={theme.colors.primary} />
                <Text style={[styles.analyticsText, {color: theme.colors.primary}]}>
                  <Text style={styles.analyticsBold}>{analytics.click_count}</Text> Tıklama
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  qrContainer: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 350,
    justifyContent: 'center',
  },
  qrImage: {
    width: 300,
    height: 300,
  },
  qrPlaceholder: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeName: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  urlContainer: {
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  urlLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  urlText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  analyticsContainer: {
    padding: 12,
    borderRadius: 8,
    width: '100%',
    borderWidth: 1,
    marginTop: 8,
  },
  analyticsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  analyticsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  analyticsText: {
    fontSize: 13,
  },
  analyticsBold: {
    fontWeight: '700',
  },
});
