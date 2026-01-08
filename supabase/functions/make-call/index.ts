import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    // Note: We don't require authentication here because employees use custom auth
    // The API key and santral_id serve as authentication
    const { api_endpoint, santral_id, api_key, extension, phone_number } = await req.json()

    if (!api_endpoint || !santral_id || !api_key || !phone_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Sanal Santral API endpoint for making calls
    // Based on typical REST API structure
    const apiUrl = api_endpoint.replace(/\/$/, '')
    
    // Try different possible endpoints
    // Sanal Santral API might use different endpoint formats
    // Based on common PBX API patterns, try:
    // 1. Query parameter based (GET request)
    // 2. Path parameter based (POST request)
    // 3. Different base URLs
    const possibleEndpoints = [
      // Try with santral_id as query parameter (GET)
      `${apiUrl}/api/call/start?santral_id=${santral_id}&extension=${extension || ''}&phone_number=${phone_number.replace(/\s+/g, '')}`,
      // Try with santral_id in path
      `${apiUrl}/api/call/${santral_id}/start`,
      `${apiUrl}/api/${santral_id}/call/start`,
      `${apiUrl}/v1/call/${santral_id}/start`,
      // Standard POST patterns
      `${apiUrl}/api/outbound/call`,
      `${apiUrl}/api/outbound/start`,
      `${apiUrl}/api/call/start`,
      `${apiUrl}/call/start`,
      `${apiUrl}/api/v1/call/start`,
      `${apiUrl}/v1/call/start`,
      `${apiUrl}/api/call`,
      `${apiUrl}/call/outbound/start`,
    ]

    let lastError = null
    let callData = null

    // Try each endpoint until one works
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`)
        
        // Try with timeout (15 seconds - reasonable timeout)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)
        
        // Check if endpoint uses query parameters (GET) or body (POST)
        const isGetRequest = endpoint.includes('?')
        const method = isGetRequest ? 'GET' : 'POST'
        
        const fetchOptions: any = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': api_key,
            'X-Santral-ID': santral_id,
            // Alternative header formats
            'Authorization': `Bearer ${api_key}`,
            'API-Key': api_key,
            'Santral-ID': santral_id,
          },
          signal: controller.signal,
        }
        
        // Only add body for POST requests
        if (!isGetRequest) {
          fetchOptions.body = JSON.stringify({
            // Try different body formats
            santral_id,
            extension: extension || null,
            phone_number: phone_number.replace(/\s+/g, ''),
            destination: phone_number.replace(/\s+/g, ''),
            caller_id: extension || null,
            phone: phone_number.replace(/\s+/g, ''),
            number: phone_number.replace(/\s+/g, ''),
            to: phone_number.replace(/\s+/g, ''),
            from: extension || null,
          })
        }
        
        const response = await fetch(endpoint, fetchOptions)
        
        clearTimeout(timeoutId)

        if (response.ok) {
          callData = await response.json()
          console.log('Call initiated successfully:', callData)
          break
        } else {
          const errorText = await response.text()
          console.log(`Endpoint ${endpoint} failed:`, response.status, errorText)
          lastError = { endpoint, status: response.status, error: errorText }
        }
      } catch (error) {
        console.log(`Endpoint ${endpoint} error:`, error)
        lastError = { endpoint, error: error.message }
      }
    }

    if (!callData) {
      return new Response(
        JSON.stringify({
          error: 'Failed to initiate call',
          details: lastError,
          message: 'All API endpoints failed. Please check API documentation for correct endpoint format.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        call_id: callData.call_id || callData.id || callData.uuid || null,
        data: callData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in make-call function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

