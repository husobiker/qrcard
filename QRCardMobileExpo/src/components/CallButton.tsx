import React, {useState} from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';
import {MaterialIcons as Icon} from '@expo/vector-icons';
import CallInterface from './CallInterface';
import {useTheme} from '../contexts/ThemeContext';
import type {EmployeeSipSettings, Company} from '../types';

interface CallButtonProps {
  employeeSipSettings: EmployeeSipSettings | null;
  company?: Company | null;
  phoneNumber?: string;
  customerName?: string;
  customerId?: string | null;
  companyId: string;
  employeeId: string;
}

export default function CallButton({
  employeeSipSettings,
  company,
  phoneNumber,
  customerName,
  customerId,
  companyId,
  employeeId,
}: CallButtonProps) {
  const {theme} = useTheme();
  const [showCallInterface, setShowCallInterface] = useState(false);

  if (!employeeSipSettings) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.gray300,
          },
        ]}
        onPress={() => setShowCallInterface(true)}
        activeOpacity={0.7}>
        <Icon name="phone" size={20} color={theme.colors.primary} />
        <Text style={[styles.buttonText, {color: theme.colors.text}]}>Ara</Text>
      </TouchableOpacity>
      {showCallInterface && (
        <CallInterface
          employeeSipSettings={employeeSipSettings}
          company={company}
          phoneNumber={phoneNumber}
          customerName={customerName}
          customerId={customerId}
          companyId={companyId}
          employeeId={employeeId}
          onClose={() => setShowCallInterface(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
