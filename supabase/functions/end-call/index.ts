import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { api_endpoint, santral_id, api_key, call_id } = await req.json()

    if (!api_endpoint || !santral_id || !api_key || !call_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Sanal Santral API endpoint for ending calls
    const apiUrl = api_endpoint.replace(/\/$/, '')
    
    // Try different possible endpoints
    const possibleEndpoints = [
      `${apiUrl}/api/call/end`,
      `${apiUrl}/call/end`,
      `${apiUrl}/api/v1/call/end`,
      `${apiUrl}/api/call/${call_id}/end`,
    ]

    let lastError = null
    let result = null

    // Try each endpoint until one works
    for (const endpoint of possibleEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': api_key,
            'X-Santral-ID': santral_id,
            'Authorization': `Bearer ${api_key}`,
            'API-Key': api_key,
            'Santral-ID': santral_id,
          },
          body: JSON.stringify({
            call_id,
            santral_id,
          }),
        })

        if (response.ok) {
          result = await response.json()
          console.log('Call ended successfully:', result)
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

    if (!result) {
      return new Response(
        JSON.stringify({
          error: 'Failed to end call',
          details: lastError,
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
        data: result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in end-call function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

