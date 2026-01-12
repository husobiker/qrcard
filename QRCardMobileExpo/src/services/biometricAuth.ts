import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricResult {
  success: boolean;
  error?: string;
}

/**
 * Check if biometric authentication is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
}

/**
 * Authenticate using biometrics (Face ID, Touch ID, or Fingerprint)
 */
export async function authenticateWithBiometrics(
  promptMessage: string = 'Authenticate to continue',
): Promise<BiometricResult> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return {
        success: false,
        error: 'Biometric authentication is not available on this device',
      };
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      return {
        success: false,
        error: 'No biometric credentials enrolled',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
    });

    if (result.success) {
      return {success: true};
    } else {
      return {
        success: false,
        error: result.error || 'Biometric authentication failed',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Biometric authentication error',
    };
  }
}

/**
 * Get biometric type available on device
 */
export async function getBiometricType(): Promise<string | null> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID / Fingerprint';
    }
    return null;
  } catch (error) {
    console.error('Error getting biometric type:', error);
    return null;
  }
}
