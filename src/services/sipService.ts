import { UserAgent, Registerer, Inviter, Invitation, SessionState } from 'sip.js'
import { supabase } from '@/supabase/client'
import type { EmployeeSipSettings, Company } from '@/types'

let userAgent: UserAgent | null = null
let registerer: Registerer | null = null
let currentSession: Inviter | null = null
let isApiBasedCalling = false
let apiCompany: Company | null = null
let apiEmployeeSettings: EmployeeSipSettings | null = null

export interface CallState {
  isConnected: boolean
  isRinging: boolean
  isOnHold: boolean
  remoteAudio: HTMLAudioElement | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
}

let callState: CallState = {
  isConnected: false,
  isRinging: false,
  isOnHold: false,
  remoteAudio: null,
  localStream: null,
  remoteStream: null,
}

export type CallStateCallback = (state: CallState) => void
let callStateCallbacks: CallStateCallback[] = []

export function onCallStateChange(callback: CallStateCallback) {
  callStateCallbacks.push(callback)
  return () => {
    callStateCallbacks = callStateCallbacks.filter(cb => cb !== callback)
  }
}

function notifyCallStateChange() {
  callStateCallbacks.forEach(cb => cb(callState))
}

export async function initializeSip(
  employeeSettings: EmployeeSipSettings,
  company?: Company | null
): Promise<boolean> {
  try {
    await disconnect()

    // Use company API settings if available (for third-party services like sanalsantral.com)
    // API-based calling will use REST API calls via Edge Function (avoids CORS)
    // Priority: API settings > Traditional SIP
    if (company?.api_endpoint && company?.api_key && company?.santral_id) {
      console.log('API settings detected, using API-based calling:', {
        endpoint: company.api_endpoint,
        santralId: company.santral_id,
        hasApiKey: !!company.api_key,
      })
      // Use API-based calling (preferred method)
      isApiBasedCalling = true
      apiCompany = company
      apiEmployeeSettings = employeeSettings
      // For API-based calling, we don't need to initialize SIP.js
      console.log('API-based calling initialized successfully')
      return true
    } else {
      console.log('No API settings found:', {
        hasCompany: !!company,
        hasEndpoint: !!company?.api_endpoint,
        hasKey: !!company?.api_key,
        hasSantralId: !!company?.santral_id,
      })
    }

    // Traditional SIP server configuration (fallback if no API settings)
    const server = employeeSettings.sip_server
    if (!server) {
      console.error('Neither SIP server nor API settings configured')
      return false
    }

    // Traditional SIP server exists, use it
    isApiBasedCalling = false
    apiCompany = null
    apiEmployeeSettings = null

    const port = employeeSettings.sip_port || 5060
    const domain = server

    // WebSocket URL - SIP.js requires WebSocket (ws:// or wss://), not UDP
    // Use wss:// for secure connections, ws:// for non-secure
    // If webrtc_enabled is true, use wss://, otherwise use ws://
    const wsServer = employeeSettings.webrtc_enabled
      ? `wss://${server}:${port}`
      : `ws://${server}:${port}`

    const options: any = {
      uri: UserAgent.makeURI(`sip:${employeeSettings.sip_username}@${domain}`),
      transportOptions: {
        server: wsServer,
      },
      authorizationUsername: employeeSettings.sip_username,
      authorizationPassword: employeeSettings.sip_password,
      displayName: `${employeeSettings.sip_username}`,
    }

    userAgent = new UserAgent(options)

    // Register to SIP server
    registerer = new Registerer(userAgent)
    
    await userAgent.start()
    await registerer.register()

    userAgent.delegate = {
      onInvite: (invitation: Invitation) => {
        handleIncomingCall(invitation)
      },
    }

    return true
  } catch (error) {
    console.error('Error initializing SIP:', error)
    return false
  }
}

export async function disconnect(): Promise<void> {
  try {
    // For API-based calling, terminate the call via Edge Function
    if (isApiBasedCalling && apiCompany && currentSession) {
      try {
        const callId = (currentSession as any).callId
        if (callId) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
          const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
          const functionUrl = `${supabaseUrl}/functions/v1/end-call`
          
          // Note: Employee authentication doesn't use Supabase Auth, so we use anon key
          await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              api_endpoint: apiCompany.api_endpoint,
              santral_id: apiCompany.santral_id,
              api_key: apiCompany.api_key,
              call_id: callId,
            }),
          })
        }
      } catch (error) {
        console.error('Error ending API call:', error)
      }
      currentSession = null
    } else if (currentSession) {
      // Traditional SIP call termination
      await currentSession.bye()
      currentSession = null
    }

    if (registerer) {
      await registerer.unregister()
      registerer = null
    }

    if (userAgent) {
      await userAgent.stop()
      userAgent = null
    }

    // Clean up media streams
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop())
      callState.localStream = null
    }

    if (callState.remoteStream) {
      callState.remoteStream.getTracks().forEach(track => track.stop())
      callState.remoteStream = null
    }

    if (callState.remoteAudio) {
      callState.remoteAudio.pause()
      callState.remoteAudio.srcObject = null
      callState.remoteAudio = null
    }

    callState = {
      isConnected: false,
      isRinging: false,
      isOnHold: false,
      remoteAudio: null,
      localStream: null,
      remoteStream: null,
    }
    
    // Reset API-based calling flags
    isApiBasedCalling = false
    apiCompany = null
    apiEmployeeSettings = null
    
    notifyCallStateChange()
  } catch (error) {
    console.error('Error disconnecting SIP:', error)
  }
}

async function makeApiCall(phoneNumber: string, company?: Company | null, employeeSettings?: EmployeeSipSettings | null): Promise<boolean> {
  try {
    // Use provided parameters or fall back to global variables
    const companyData = company || apiCompany
    const employeeSettingsData = employeeSettings || apiEmployeeSettings
    
    if (!companyData || !employeeSettingsData) {
      console.error('API settings not configured:', { companyData, employeeSettingsData, apiCompany, apiEmployeeSettings })
      throw new Error('API settings not configured. Please ensure API settings are saved in company profile.')
    }

    if (currentSession) {
      throw new Error('Call already in progress')
    }

    console.log('Starting API call with:', {
      api_endpoint: companyData.api_endpoint,
      santral_id: companyData.santral_id,
      extension: employeeSettingsData.extension || employeeSettingsData.sip_username,
      phone_number: phoneNumber,
    })

    // Get user media for the call
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    })
    callState.localStream = localStream
    console.log('Microphone access granted')

    // Use Supabase Edge Function as proxy to avoid CORS issues
    // The Edge Function will call Sanal Santral API
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const functionUrl = `${supabaseUrl}/functions/v1/make-call`

    // Prepare request body
    const requestBody = {
      api_endpoint: companyData.api_endpoint,
      santral_id: companyData.santral_id,
      api_key: companyData.api_key,
      extension: employeeSettingsData.extension || employeeSettingsData.sip_username,
      phone_number: phoneNumber.replace(/\s+/g, ''), // Remove spaces
    }

    console.log('Calling Edge Function:', functionUrl)
    console.log('Request body:', { ...requestBody, api_key: '***' }) // Hide API key in logs

    // Make API call via Supabase Edge Function
    // Note: Employee authentication doesn't use Supabase Auth, so we use anon key
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('Edge Function response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      console.error('Edge Function error:', errorData)
      throw new Error(`API call failed: ${errorData.message || response.statusText}`)
    }

    const callData = await response.json()
    console.log('Call initiated successfully:', callData)

    // Store call ID for later termination
    if (callData.call_id) {
      currentSession = { callId: callData.call_id } as any
    }

    // Mark call as ringing
    callState.isRinging = true
    notifyCallStateChange()

    // Simulate call connection (in real implementation, you'd use WebRTC or SIP for media)
    // For now, we'll just mark it as connected after a short delay
    setTimeout(() => {
      if (callState.isRinging) {
        callState.isConnected = true
        callState.isRinging = false
        notifyCallStateChange()
      }
    }, 2000)

    return true
  } catch (error) {
    console.error('Error making API call:', error)
    callState.isRinging = false
    notifyCallStateChange()
    return false
  }
}

export async function makeCall(phoneNumber: string, company?: Company | null, employeeSettings?: EmployeeSipSettings | null): Promise<boolean> {
  try {
    console.log('makeCall called with:', { phoneNumber, company: company?.id, hasApiSettings: !!(company?.api_endpoint && company?.api_key && company?.santral_id), isApiBasedCalling })
    
    // Use API-based calling if configured
    // Check if API settings are available (either from parameters or global state)
    const hasApiSettings = (company?.api_endpoint && company?.api_key && company?.santral_id) || 
                           (apiCompany?.api_endpoint && apiCompany?.api_key && apiCompany?.santral_id)
    
    console.log('Calling method check:', { hasApiSettings, isApiBasedCalling, companyApiEndpoint: company?.api_endpoint, apiCompanyEndpoint: apiCompany?.api_endpoint })
    
    if (isApiBasedCalling || hasApiSettings) {
      console.log('Using API-based calling')
      return await makeApiCall(phoneNumber, company, employeeSettings)
    }

    // Traditional SIP calling
    console.log('Using traditional SIP calling')
    if (!userAgent) {
      console.error('SIP userAgent not initialized')
      throw new Error('SIP not initialized')
    }

    if (currentSession) {
      throw new Error('Call already in progress')
    }

    // Get user media
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    })

    callState.localStream = localStream

    // Create invite
    const targetURI = UserAgent.makeURI(`sip:${phoneNumber}@${userAgent.configuration.uri?.host}`)
    if (!targetURI) {
      throw new Error('Invalid phone number')
    }

    const inviter = new Inviter(userAgent, targetURI, {
      sessionDescriptionHandlerOptions: {
        constraints: {
          audio: true,
          video: false,
        },
      },
    })

    // Set local media
    const sessionDescriptionHandler = inviter.sessionDescriptionHandler
    if (sessionDescriptionHandler && localStream) {
      sessionDescriptionHandler.localMediaStream = localStream
    }

    currentSession = inviter

    // Handle session state changes
    inviter.stateChange.addListener((newState: SessionState) => {
      handleSessionStateChange(newState, inviter)
    })

    // Send invite
    await inviter.invite()

    callState.isRinging = true
    notifyCallStateChange()

    return true
  } catch (error) {
    console.error('Error making call:', error)
    callState.isRinging = false
    notifyCallStateChange()
    return false
  }
}

export async function answerCall(): Promise<boolean> {
  // This would be handled by the incoming call handler
  // Implementation depends on how we store the incoming invitation
  return false
}

export async function hangUp(): Promise<void> {
  try {
    // For API-based calling, terminate via Edge Function
    if (isApiBasedCalling && apiCompany && currentSession) {
      try {
        const callId = (currentSession as any).callId
        if (callId) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
          const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
          const functionUrl = `${supabaseUrl}/functions/v1/end-call`
          
          // Note: Employee authentication doesn't use Supabase Auth, so we use anon key
          await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              api_endpoint: apiCompany.api_endpoint,
              santral_id: apiCompany.santral_id,
              api_key: apiCompany.api_key,
              call_id: callId,
            }),
          })
        }
      } catch (error) {
        console.error('Error ending API call:', error)
      }
      currentSession = null
    } else if (currentSession) {
      // Traditional SIP call termination
      await currentSession.bye()
      currentSession = null
    }

    // Clean up media streams
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop())
      callState.localStream = null
    }

    if (callState.remoteStream) {
      callState.remoteStream.getTracks().forEach(track => track.stop())
      callState.remoteStream = null
    }

    if (callState.remoteAudio) {
      callState.remoteAudio.pause()
      callState.remoteAudio.srcObject = null
      callState.remoteAudio = null
    }

    callState = {
      isConnected: false,
      isRinging: false,
      isOnHold: false,
      remoteAudio: null,
      localStream: null,
      remoteStream: null,
    }
    notifyCallStateChange()
  } catch (error) {
    console.error('Error hanging up:', error)
  }
}

export function getCallState(): CallState {
  return { ...callState }
}

function handleIncomingCall(invitation: Invitation) {
  // Handle incoming call
  // This would typically show a notification to the user
  console.log('Incoming call:', invitation)
  
  invitation.stateChange.addListener((newState: SessionState) => {
    if (newState === SessionState.Established) {
      handleRemoteStream(invitation)
    }
  })
}

function handleSessionStateChange(state: SessionState, session: Inviter | Invitation) {
  switch (state) {
    case SessionState.Established:
      callState.isConnected = true
      callState.isRinging = false
      handleRemoteStream(session)
      break
    case SessionState.Terminated:
      callState.isConnected = false
      callState.isRinging = false
      currentSession = null
      break
    default:
      break
  }
  notifyCallStateChange()
}

function handleRemoteStream(session: Inviter | Invitation) {
  try {
    const sessionDescriptionHandler = session.sessionDescriptionHandler
    if (sessionDescriptionHandler && sessionDescriptionHandler.remoteMediaStream) {
      const remoteStream = sessionDescriptionHandler.remoteMediaStream
      callState.remoteStream = remoteStream

      // Create audio element for remote audio
      const audio = new Audio()
      audio.srcObject = remoteStream
      audio.autoplay = true
      callState.remoteAudio = audio
      notifyCallStateChange()
    }
  } catch (error) {
    console.error('Error handling remote stream:', error)
  }
}

