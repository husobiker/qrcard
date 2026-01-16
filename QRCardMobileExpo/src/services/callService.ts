import {Linking} from 'react-native';
import {supabase} from './supabase';
import Constants from 'expo-constants';
import type {EmployeeSipSettings, Company} from '../types';

// For mobile, we don't use SIP.js - only API-based calling or tel: links
let isApiBasedCalling = false;
let apiCompany: Company | null = null;
let apiEmployeeSettings: EmployeeSipSettings | null = null;
let currentSession: {callId?: string} | null = null;

export interface CallState {
  isConnected: boolean;
  isRinging: boolean;
  isOnHold: boolean;
  localStream: any | null; // For mobile, this would be audio recording if needed
  remoteStream: any | null;
}

let callState: CallState = {
  isConnected: false,
  isRinging: false,
  isOnHold: false,
  localStream: null,
  remoteStream: null,
};

export type CallStateCallback = (state: CallState) => void;
let callStateCallbacks: CallStateCallback[] = [];

export function onCallStateChange(callback: CallStateCallback) {
  callStateCallbacks.push(callback);
  return () => {
    callStateCallbacks = callStateCallbacks.filter(cb => cb !== callback);
  };
}

function notifyCallStateChange() {
  callStateCallbacks.forEach(cb => cb(callState));
}

export async function initializeSip(
  employeeSettings: EmployeeSipSettings,
  company?: Company | null,
): Promise<boolean> {
  try {
    await disconnect();

    // Use company API settings if available (for third-party services like sanalsantral.com)
    // API-based calling will use REST API calls via Edge Function (avoids CORS)
    // Priority: API settings > tel: link fallback
    if (company?.api_endpoint && company?.api_key && company?.santral_id) {
      console.log('API settings detected, using API-based calling:', {
        endpoint: company.api_endpoint,
        santralId: company.santral_id,
        hasApiKey: !!company.api_key,
      });
      // Use API-based calling (preferred method)
      isApiBasedCalling = true;
      apiCompany = company;
      apiEmployeeSettings = employeeSettings;
      console.log('API-based calling initialized successfully');
      return true;
    } else {
      console.log('No API settings found, will use tel: link fallback:', {
        hasCompany: !!company,
        hasEndpoint: !!company?.api_endpoint,
        hasKey: !!company?.api_key,
        hasSantralId: !!company?.santral_id,
      });
      // For mobile, if no API settings, we can still use tel: links
      isApiBasedCalling = false;
      apiCompany = null;
      apiEmployeeSettings = null;
      return true; // Return true because tel: links are always available
    }
  } catch (error) {
    console.error('Error initializing call service:', error);
    return false;
  }
}

export async function disconnect(): Promise<void> {
  try {
    // For API-based calling, terminate the call via Edge Function
    if (isApiBasedCalling && apiCompany && currentSession) {
      try {
        const callId = (currentSession as any).callId;
        if (callId) {
          const supabaseUrl =
            Constants.expoConfig?.extra?.supabaseUrl ||
            process.env.SUPABASE_URL ||
            '';
          const anonKey =
            Constants.expoConfig?.extra?.supabaseAnonKey ||
            process.env.SUPABASE_ANON_KEY ||
            '';
          const functionUrl = `${supabaseUrl}/functions/v1/end-call`;

          await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              api_endpoint: apiCompany.api_endpoint,
              santral_id: apiCompany.santral_id,
              api_key: apiCompany.api_key,
              call_id: callId,
            }),
          });
        }
      } catch (error) {
        console.error('Error ending API call:', error);
      }
    }

    currentSession = null;
    callState.isConnected = false;
    callState.isRinging = false;
    callState.isOnHold = false;
    callState.localStream = null;
    callState.remoteStream = null;

    // Reset API-based calling flags
    isApiBasedCalling = false;
    apiCompany = null;
    apiEmployeeSettings = null;

    notifyCallStateChange();
  } catch (error) {
    console.error('Error disconnecting call service:', error);
  }
}

async function makeApiCall(
  phoneNumber: string,
  company?: Company | null,
  employeeSettings?: EmployeeSipSettings | null,
): Promise<boolean> {
  try {
    // Use provided parameters or fall back to global variables
    const companyData = company || apiCompany;
    const employeeSettingsData = employeeSettings || apiEmployeeSettings;

    if (!companyData || !employeeSettingsData) {
      console.error('API settings not configured:', {
        companyData,
        employeeSettingsData,
        apiCompany,
        apiEmployeeSettings,
      });
      throw new Error(
        'API settings not configured. Please ensure API settings are saved in company profile.',
      );
    }

    if (currentSession) {
      throw new Error('Call already in progress');
    }

    console.log('Starting API call with:', {
      api_endpoint: companyData.api_endpoint,
      santral_id: companyData.santral_id,
      extension:
        employeeSettingsData.extension || employeeSettingsData.sip_username,
      phone_number: phoneNumber,
    });

    // Use Supabase Edge Function as proxy to avoid CORS issues
    // The Edge Function will call Sanal Santral API
    const supabaseUrl =
      Constants.expoConfig?.extra?.supabaseUrl ||
      process.env.SUPABASE_URL ||
      '';
    const anonKey =
      Constants.expoConfig?.extra?.supabaseAnonKey ||
      process.env.SUPABASE_ANON_KEY ||
      '';
    const functionUrl = `${supabaseUrl}/functions/v1/make-call`;

    // Prepare request body
    const requestBody = {
      api_endpoint: companyData.api_endpoint,
      santral_id: companyData.santral_id,
      api_key: companyData.api_key,
      extension:
        employeeSettingsData.extension || employeeSettingsData.sip_username,
      phone_number: phoneNumber.replace(/\s+/g, ''), // Remove spaces
    };

    console.log('Calling Edge Function:', functionUrl);
    console.log('Request body:', {...requestBody, api_key: '***'}); // Hide API key in logs

    // Make API call via Supabase Edge Function
    // Note: Employee authentication doesn't use Supabase Auth, so we use anon key
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Edge Function response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Unknown error',
      }));
      console.error('Edge Function error:', errorData);
      throw new Error(
        `API call failed: ${errorData.message || response.statusText}`,
      );
    }

    const callData = await response.json();
    console.log('Call initiated successfully:', callData);

    // Store call ID for later termination
    if (callData.call_id) {
      currentSession = {callId: callData.call_id};
    }

    // Mark call as ringing
    callState.isRinging = true;
    notifyCallStateChange();

    // Simulate call connection (in real implementation, you'd use WebRTC or native calling)
    // For now, we'll just mark it as connected after a short delay
    setTimeout(() => {
      if (callState.isRinging) {
        callState.isConnected = true;
        callState.isRinging = false;
        notifyCallStateChange();
      }
    }, 2000);

    return true;
  } catch (error) {
    console.error('Error making API call:', error);
    callState.isRinging = false;
    notifyCallStateChange();
    return false;
  }
}

export async function makeCall(
  phoneNumber: string,
  company?: Company | null,
  employeeSettings?: EmployeeSipSettings | null,
): Promise<boolean> {
  try {
    console.log('makeCall called with:', {
      phoneNumber,
      company: company?.id,
      hasApiSettings: !!(
        company?.api_endpoint && company?.api_key && company?.santral_id
      ),
      isApiBasedCalling,
    });

    // Use API-based calling if configured
    // Check if API settings are available (either from parameters or global state)
    const hasApiSettings =
      (company?.api_endpoint && company?.api_key && company?.santral_id) ||
      (apiCompany?.api_endpoint &&
        apiCompany?.api_key &&
        apiCompany?.santral_id);

    console.log('Calling method check:', {
      hasApiSettings,
      isApiBasedCalling,
      companyApiEndpoint: company?.api_endpoint,
      apiCompanyEndpoint: apiCompany?.api_endpoint,
    });

    if (isApiBasedCalling || hasApiSettings) {
      console.log('Using API-based calling');
      return await makeApiCall(phoneNumber, company, employeeSettings);
    }

    // Fallback: Use tel: link to open phone app
    console.log('Using tel: link fallback');
    const phoneUrl = `tel:${phoneNumber.replace(/\s+/g, '')}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);
    if (canOpen) {
      await Linking.openURL(phoneUrl);
      // Mark as connected immediately for tel: links (user handles call in phone app)
      callState.isConnected = true;
      callState.isRinging = false;
      notifyCallStateChange();
      return true;
    } else {
      throw new Error('Cannot open phone app');
    }
  } catch (error) {
    console.error('Error making call:', error);
    callState.isRinging = false;
    callState.isConnected = false;
    notifyCallStateChange();
    return false;
  }
}

export async function hangUp(): Promise<void> {
  try {
    // For API-based calling, terminate via Edge Function
    if (isApiBasedCalling && apiCompany && currentSession) {
      try {
        const callId = (currentSession as any).callId;
        if (callId) {
          const supabaseUrl =
            Constants.expoConfig?.extra?.supabaseUrl ||
            process.env.SUPABASE_URL ||
            '';
          const anonKey =
            Constants.expoConfig?.extra?.supabaseAnonKey ||
            process.env.SUPABASE_ANON_KEY ||
            '';
          const functionUrl = `${supabaseUrl}/functions/v1/end-call`;

          await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              api_endpoint: apiCompany.api_endpoint,
              santral_id: apiCompany.santral_id,
              api_key: apiCompany.api_key,
              call_id: callId,
            }),
          });
        }
      } catch (error) {
        console.error('Error ending API call:', error);
      }
    }

    currentSession = null;
    callState.isConnected = false;
    callState.isRinging = false;
    callState.isOnHold = false;
    notifyCallStateChange();
  } catch (error) {
    console.error('Error hanging up:', error);
  }
}

export function getCallState(): CallState {
  return {...callState};
}
