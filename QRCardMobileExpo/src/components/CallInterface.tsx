import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MaterialIcons as Icon} from '@expo/vector-icons';
import {
  initializeSip,
  makeCall,
  hangUp,
  disconnect,
  getCallState,
  onCallStateChange,
  type CallState,
} from '../services/callService';
import {createCallLog, type CallLogFormData} from '../services/callLogService';
import {useTheme} from '../contexts/ThemeContext';
import type {EmployeeSipSettings, Company} from '../types';

interface CallInterfaceProps {
  employeeSipSettings: EmployeeSipSettings;
  company?: Company | null;
  phoneNumber?: string;
  customerName?: string;
  customerId?: string | null;
  companyId: string;
  employeeId: string;
  onClose: () => void;
}

export default function CallInterface({
  employeeSipSettings,
  company,
  phoneNumber: initialPhoneNumber,
  customerName: initialCustomerName,
  customerId,
  companyId,
  employeeId,
  onClose,
}: CallInterfaceProps) {
  const {theme} = useTheme();
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || '');
  const [customerName, setCustomerName] = useState(initialCustomerName || '');
  const [callState, setCallState] = useState<CallState>(getCallState());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const callStartTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    // Initialize call service
    const init = async () => {
      console.log('Initializing call service with:', {
        hasCompany: !!company,
        hasApiSettings: !!(
          company?.api_endpoint && company?.api_key && company?.santral_id
        ),
        hasSipServer: !!employeeSipSettings?.sip_server,
      });
      const success = await initializeSip(employeeSipSettings, company);
      console.log('Call service initialization result:', success);
      setIsInitialized(success);

      if (!success) {
        console.error('Call service initialization failed.');
      }
    };
    init();

    // Subscribe to call state changes
    const unsubscribe = onCallStateChange(state => {
      setCallState(state);
    });

    return () => {
      unsubscribe();
      disconnect();
    };
  }, [employeeSipSettings, company]);

  const handleCall = async () => {
    console.log('handleCall called with:', {
      phoneNumber,
      company,
      employeeSipSettings,
    });

    if (!phoneNumber.trim()) {
      Alert.alert('Hata', 'Lütfen telefon numarası girin');
      return;
    }

    if (!isInitialized) {
      console.error('Call service not initialized');
      Alert.alert('Hata', 'Arama servisi hazır değil. Lütfen bekleyin...');
      return;
    }

    console.log('Starting call...');
    callStartTimeRef.current = new Date();

    try {
      // Pass company and employee settings to makeCall
      const success = await makeCall(phoneNumber, company, employeeSipSettings);
      console.log('makeCall result:', success);

      if (!success) {
        Alert.alert('Hata', 'Arama başlatılamadı. Konsolu kontrol edin.');
      } else {
        console.log('Call initiated successfully');
      }
    } catch (error) {
      console.error('Error in handleCall:', error);
      Alert.alert(
        'Hata',
        `Arama başlatılırken hata oluştu: ${
          error instanceof Error ? error.message : 'Bilinmeyen hata'
        }`,
      );
    }
  };

  const handleHangUp = async () => {
    const endTime = new Date();
    const duration = callStartTimeRef.current
      ? Math.floor(
          (endTime.getTime() - callStartTimeRef.current.getTime()) / 1000,
        )
      : 0;

    // Save call log
    if (callStartTimeRef.current) {
      const callLogData: CallLogFormData = {
        employee_id: employeeId,
        call_type: 'outgoing',
        phone_number: phoneNumber,
        customer_name: customerName || undefined,
        customer_id: customerId || undefined,
        call_duration: duration,
        call_status: callState.isConnected ? 'completed' : 'failed',
        call_start_time: callStartTimeRef.current.toISOString(),
        call_end_time: endTime.toISOString(),
      };
      await createCallLog(companyId, callLogData);
    }

    await hangUp();
    callStartTimeRef.current = null;
  };

  const handleMute = () => {
    // For mobile, mute functionality would depend on native audio implementation
    setIsMuted(!isMuted);
  };

  const handleClose = async () => {
    if (callState.isConnected || callState.isRinging) {
      await handleHangUp();
    }
    await disconnect();
    onClose();
  };

  return (
    <Modal visible={true} transparent animationType="slide">
      <SafeAreaView
        style={[styles.modalContainer, {backgroundColor: theme.colors.background}]}
        edges={['top', 'bottom']}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={[styles.title, {color: theme.colors.text}]}>
              {callState.isConnected || callState.isRinging
                ? 'Arama Devam Ediyor'
                : 'Arama Yap'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {!isInitialized && (
              <View
                style={[
                  styles.infoBox,
                  {backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary},
                ]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.infoText, {color: theme.colors.primary}]}>
                  Arama servisi kuruluyor...
                </Text>
              </View>
            )}

            {!callState.isConnected && !callState.isRinging && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, {color: theme.colors.text}]}>
                    Müşteri Adı (Opsiyonel)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="Müşteri adı (opsiyonel)"
                    placeholderTextColor={theme.colors.gray500}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, {color: theme.colors.text}]}>
                    Telefon Numarası *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.colors.text,
                        borderColor: theme.colors.gray300,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="+90 555 123 4567 veya 05551234567"
                    placeholderTextColor={theme.colors.gray500}
                    keyboardType="phone-pad"
                  />
                  <Text style={[styles.hint, {color: theme.colors.textSecondary}]}>
                    Ülke kodu ile birlikte girin (örn: +90 555 123 4567)
                  </Text>
                </View>
              </>
            )}

            {(callState.isConnected || callState.isRinging) && (
              <View style={styles.callInfo}>
                <Text style={[styles.customerName, {color: theme.colors.text}]}>
                  {customerName || phoneNumber}
                </Text>
                <Text style={[styles.phoneNumber, {color: theme.colors.textSecondary}]}>
                  {phoneNumber}
                </Text>
                {callState.isRinging && (
                  <Text style={[styles.status, {color: theme.colors.textSecondary}]}>
                    Aranıyor...
                  </Text>
                )}
              </View>
            )}

            <View style={styles.controls}>
              {!callState.isConnected && !callState.isRinging ? (
                <TouchableOpacity
                  style={[
                    styles.callButton,
                    {
                      backgroundColor: theme.colors.primary,
                      opacity: !isInitialized || !phoneNumber.trim() ? 0.5 : 1,
                    },
                  ]}
                  onPress={handleCall}
                  disabled={!isInitialized || !phoneNumber.trim()}>
                  <Icon name="phone" size={24} color="#fff" />
                  <Text style={styles.callButtonText}>Ara</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.callControls}>
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.gray300,
                      },
                    ]}
                    onPress={handleMute}
                    disabled={!callState.isConnected}>
                    <Icon
                      name={isMuted ? 'mic-off' : 'mic'}
                      size={24}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.hangUpButton,
                      {backgroundColor: theme.colors.error},
                    ]}
                    onPress={handleHangUp}>
                    <Icon name="call-end" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {isInitialized && !callState.isConnected && !callState.isRinging && (
              <View
                style={[
                  styles.successBox,
                  {
                    backgroundColor: theme.colors.success + '20',
                    borderColor: theme.colors.success,
                  },
                ]}>
                <Text style={[styles.successText, {color: theme.colors.success}]}>
                  ✓ Arama servisi hazır - Arama yapabilirsiniz
                </Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  callInfo: {
    alignItems: 'center',
    marginVertical: 24,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
  },
  controls: {
    marginTop: 24,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hangUpButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
  },
  successText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
