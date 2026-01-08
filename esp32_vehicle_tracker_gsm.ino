/*
 * ESP32 Vehicle Tracker with GSM/4G Support
 * GPS-based vehicle tracking system with SIM card connectivity
 * Works without WiFi - uses cellular network (2G/3G/4G)
 * 
 * Hardware Requirements:
 * - ESP32 Development Board
 * - NEO-6M or NEO-8M GPS Module
 * - SIM800L (2G) or SIM7600 (4G) GSM/GPRS Module
 * - SIM Card with data plan
 * - Optional: Battery for backup power
 * 
 * Libraries Required:
 * - WiFi (built-in) - Not used in GSM mode
 * - HTTPClient (built-in)
 * - TinyGPS++ (install from Library Manager)
 * - ArduinoJson (install from Library Manager)
 * - SoftwareSerial (for SIM800L) or HardwareSerial (for SIM7600)
 * 
 * Setup:
 * 1. Install required libraries
 * 2. Configure GSM module settings
 * 3. Configure Supabase URL and API key
 * 4. Set DEVICE_ID (unique for each device)
 * 5. Insert SIM card with active data plan
 * 6. Upload to ESP32
 */

#include <HTTPClient.h>
#include <TinyGPS++.h>
#include <ArduinoJson.h>
#include <HardwareSerial.h>

// ========== CONFIGURATION ==========
// Choose your GSM module: SIM800L (2G) or SIM7600 (4G)
#define USE_SIM800L true  // Set to false for SIM7600

// Supabase Configuration
const char* supabaseUrl = "https://your-project.supabase.co";
const char* supabaseKey = "your-anon-key-here";
const char* supabaseEndpoint = "/rest/v1/vehicle_locations";

// Device Configuration
const char* DEVICE_ID = "ESP32-GSM-001"; // Unique device identifier - CHANGE THIS FOR EACH DEVICE
const char* DEVICE_NAME = "Araç 1"; // Friendly device name

// GPS Configuration
#define GPS_RX_PIN 16  // GPS RX pin (connects to ESP32 TX)
#define GPS_TX_PIN 17  // GPS TX pin (connects to ESP32 RX)
#define GPS_BAUD 9600  // GPS module baud rate

// GSM Module Configuration
#if USE_SIM800L
  // SIM800L (2G) Configuration
  #define GSM_RX_PIN 4   // SIM800L TX connects to ESP32 RX (GPIO 4)
  #define GSM_TX_PIN 2   // SIM800L RX connects to ESP32 TX (GPIO 2)
  #define GSM_BAUD 9600
  #define GSM_POWER_PIN 5 // SIM800L power pin (optional, for power control)
#else
  // SIM7600 (4G) Configuration
  #define GSM_RX_PIN 18  // SIM7600 TX connects to ESP32 RX (GPIO 18)
  #define GSM_TX_PIN 19  // SIM7600 RX connects to ESP32 TX (GPIO 19)
  #define GSM_BAUD 115200
  #define GSM_POWER_PIN 23 // SIM7600 power pin
#endif

// SIM Card Configuration
const char* APN = "internet"; // APN for your mobile operator
// Common APNs in Turkey:
// - Turkcell: internet
// - Vodafone: internet
// - Türk Telekom: internet

// Update Interval (milliseconds)
const unsigned long UPDATE_INTERVAL = 60000; // Send location every 60 seconds (GSM uses more battery)
const unsigned long GPS_TIMEOUT = 10000;     // Wait max 10 seconds for GPS fix
const unsigned long GSM_TIMEOUT = 30000;     // Wait max 30 seconds for GSM connection

// ========== GLOBAL VARIABLES ==========
HardwareSerial gpsSerial(1);
HardwareSerial gsmSerial(2);
TinyGPS++ gps;
unsigned long lastUpdate = 0;
bool gsmConnected = false;
bool gprsConnected = false;

// ========== SETUP ==========
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("ESP32 Vehicle Tracker with GSM Starting...");
  Serial.println("Device ID: " + String(DEVICE_ID));
  
  // Initialize GPS
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("GPS Module Initialized");
  
  // Initialize GSM
  gsmSerial.begin(GSM_BAUD, SERIAL_8N1, GSM_RX_PIN, GSM_TX_PIN);
  Serial.println("GSM Module Initialized");
  
  // Power on GSM module (if power pin is connected)
  #if defined(GSM_POWER_PIN)
    pinMode(GSM_POWER_PIN, OUTPUT);
    digitalWrite(GSM_POWER_PIN, HIGH);
    delay(1000);
    digitalWrite(GSM_POWER_PIN, LOW);
    delay(2000);
    digitalWrite(GSM_POWER_PIN, HIGH);
    delay(3000); // Wait for module to boot
  #endif
  
  // Initialize GSM module
  initializeGSM();
  
  Serial.println("Setup Complete!");
}

// ========== MAIN LOOP ==========
void loop() {
  // Read GPS data
  while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      // GPS data decoded successfully
    }
  }
  
  // Check GSM connection
  if (!gsmConnected) {
    checkGSMConnection();
  }
  
  // Check GPRS connection
  if (gsmConnected && !gprsConnected) {
    connectGPRS();
  }
  
  // Send location data at intervals
  unsigned long currentTime = millis();
  if (currentTime - lastUpdate >= UPDATE_INTERVAL) {
    if (gsmConnected && gprsConnected && gps.location.isValid()) {
      sendLocationToSupabase();
      lastUpdate = currentTime;
    } else {
      if (!gsmConnected) {
        Serial.println("GSM not connected, retrying...");
        checkGSMConnection();
      }
      if (!gprsConnected) {
        Serial.println("GPRS not connected, retrying...");
        connectGPRS();
      }
      if (!gps.location.isValid()) {
        Serial.println("GPS not fixed, waiting...");
        Serial.print("Satellites: ");
        Serial.println(gps.satellites.value());
      }
    }
  }
  
  delay(1000);
}

// ========== GSM FUNCTIONS ==========
void initializeGSM() {
  Serial.println("Initializing GSM module...");
  
  // Wait for module to be ready
  delay(2000);
  
  // Send AT command to check if module is responding
  sendATCommand("AT", 2000);
  
  // Disable echo
  sendATCommand("ATE0", 1000);
  
  // Check SIM card
  String response = sendATCommand("AT+CPIN?", 2000);
  if (response.indexOf("READY") == -1) {
    Serial.println("ERROR: SIM card not ready!");
    Serial.println("Please check SIM card insertion and PIN code");
    return;
  }
  Serial.println("SIM card OK");
  
  // Get network registration
  checkGSMConnection();
}

void checkGSMConnection() {
  Serial.println("Checking GSM network...");
  
  // Check network registration
  String response = sendATCommand("AT+CREG?", 3000);
  if (response.indexOf("+CREG: 0,1") != -1 || response.indexOf("+CREG: 0,5") != -1) {
    gsmConnected = true;
    Serial.println("GSM Network: Connected");
    
    // Get signal strength
    response = sendATCommand("AT+CSQ", 2000);
    Serial.println("Signal: " + response);
  } else {
    gsmConnected = false;
    Serial.println("GSM Network: Not connected");
    Serial.println("Response: " + response);
  }
}

void connectGPRS() {
  if (!gsmConnected) {
    Serial.println("GSM not connected, cannot connect GPRS");
    return;
  }
  
  Serial.println("Connecting to GPRS...");
  
  // Set APN
  String cmd = "AT+CSTT=\"" + String(APN) + "\"";
  String response = sendATCommand(cmd, 5000);
  if (response.indexOf("OK") == -1) {
    Serial.println("Failed to set APN");
    return;
  }
  
  // Activate GPRS
  response = sendATCommand("AT+CIICR", 10000);
  if (response.indexOf("OK") == -1) {
    Serial.println("Failed to activate GPRS");
    return;
  }
  
  // Get IP address
  response = sendATCommand("AT+CIFSR", 5000);
  if (response.indexOf("ERROR") != -1 || response.length() < 7) {
    Serial.println("Failed to get IP address");
    gprsConnected = false;
    return;
  }
  
  gprsConnected = true;
  Serial.println("GPRS Connected! IP: " + response);
}

String sendATCommand(String command, unsigned long timeout) {
  gsmSerial.println(command);
  delay(100);
  
  unsigned long startTime = millis();
  String response = "";
  
  while (millis() - startTime < timeout) {
    if (gsmSerial.available()) {
      char c = gsmSerial.read();
      response += c;
      
      // Check for complete response
      if (response.indexOf("OK") != -1 || response.indexOf("ERROR") != -1) {
        break;
      }
    }
    delay(10);
  }
  
  // Also read from Serial for debugging
  Serial.print("AT> ");
  Serial.println(command);
  Serial.print("AT< ");
  Serial.println(response);
  
  return response;
}

// ========== SEND LOCATION TO SUPABASE ==========
void sendLocationToSupabase() {
  if (!gps.location.isValid()) {
    Serial.println("Invalid GPS location, skipping send");
    return;
  }
  
  if (!gprsConnected) {
    Serial.println("GPRS not connected, cannot send data");
    return;
  }
  
  // Get GPS data
  double latitude = gps.location.lat();
  double longitude = gps.location.lng();
  double altitude = gps.altitude.meters();
  double speed = gps.speed.kmph();
  double heading = gps.course.deg();
  int satellites = gps.satellites.value();
  unsigned long age = gps.location.age();
  
  // Calculate accuracy
  double accuracy = 10.0;
  if (satellites > 0) {
    accuracy = 50.0 / satellites;
  }
  
  // Get battery level (if available)
  int batteryLevel = 100; // Implement actual reading if available
  
  // Get GSM signal strength
  int signalStrength = 0;
  String response = sendATCommand("AT+CSQ", 2000);
  if (response.indexOf("+CSQ:") != -1) {
    int rssi = response.substring(response.indexOf("+CSQ:") + 6, response.indexOf(",")).toInt();
    // Convert RSSI (0-31) to percentage
    signalStrength = map(rssi, 0, 31, 0, 100);
  }
  
  // Get vehicle_id from device_id
  String vehicleId = getVehicleIdFromDevice();
  if (vehicleId == "") {
    Serial.println("Vehicle ID not found for device: " + String(DEVICE_ID));
    return;
  }
  
  // Create JSON payload
  DynamicJsonDocument locationDoc(1024);
  locationDoc["vehicle_id"] = vehicleId;
  locationDoc["latitude"] = latitude;
  locationDoc["longitude"] = longitude;
  locationDoc["altitude"] = altitude;
  locationDoc["speed"] = speed;
  locationDoc["heading"] = heading;
  locationDoc["accuracy"] = accuracy;
  locationDoc["satellite_count"] = satellites;
  locationDoc["battery_level"] = batteryLevel;
  locationDoc["signal_strength"] = signalStrength;
  
  String jsonPayload;
  serializeJson(locationDoc, jsonPayload);
  
  Serial.println("Sending location data via GPRS...");
  Serial.println(jsonPayload);
  
  // Send HTTP POST via GPRS
  String url = String(supabaseUrl) + String(supabaseEndpoint);
  
  // Start HTTP connection
  sendATCommand("AT+HTTPINIT", 2000);
  
  // Set HTTP parameters
  String httpCmd = "AT+HTTPPARA=\"URL\",\"" + url + "\"";
  sendATCommand(httpCmd, 3000);
  
  // Set content type
  sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 2000);
  
  // Set headers
  String headerCmd = "AT+HTTPPARA=\"USERDATA\",\"apikey: " + String(supabaseKey) + "\\r\\nAuthorization: Bearer " + String(supabaseKey) + "\"";
  sendATCommand(headerCmd, 2000);
  
  // Set data length
  httpCmd = "AT+HTTPDATA=" + String(jsonPayload.length()) + ",10000";
  sendATCommand(httpCmd, 2000);
  delay(500);
  
  // Send data
  gsmSerial.print(jsonPayload);
  delay(2000);
  
  // Send HTTP POST request
  String httpResponse = sendATCommand("AT+HTTPACTION=1", 15000);
  
  // Read response
  if (httpResponse.indexOf("200") != -1 || httpResponse.indexOf("201") != -1) {
    Serial.println("Location sent successfully!");
    
    // Read response body
    sendATCommand("AT+HTTPREAD", 5000);
  } else {
    Serial.print("Error sending location: ");
    Serial.println(httpResponse);
  }
  
  // Terminate HTTP
  sendATCommand("AT+HTTPTERM", 2000);
}

String getVehicleIdFromDevice() {
  // This is a simplified version - in production, cache the vehicle_id
  // to avoid making this call every time
  
  String url = String(supabaseUrl) + "/rest/v1/rpc/get_vehicle_by_device_id";
  
  // Start HTTP connection
  sendATCommand("AT+HTTPINIT", 2000);
  
  // Set HTTP parameters
  String httpCmd = "AT+HTTPPARA=\"URL\",\"" + url + "\"";
  sendATCommand(httpCmd, 3000);
  
  // Set content type
  sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 2000);
  
  // Set headers
  String headerCmd = "AT+HTTPPARA=\"USERDATA\",\"apikey: " + String(supabaseKey) + "\\r\\nAuthorization: Bearer " + String(supabaseKey) + "\"";
  sendATCommand(headerCmd, 2000);
  
  // Create request payload
  DynamicJsonDocument requestDoc(256);
  requestDoc["p_device_id"] = DEVICE_ID;
  String deviceQuery;
  serializeJson(requestDoc, deviceQuery);
  
  // Set data length
  httpCmd = "AT+HTTPDATA=" + String(deviceQuery.length()) + ",10000";
  sendATCommand(httpCmd, 2000);
  delay(500);
  
  // Send data
  gsmSerial.print(deviceQuery);
  delay(2000);
  
  // Send HTTP POST request
  String httpResponse = sendATCommand("AT+HTTPACTION=1", 15000);
  
  String vehicleId = "";
  if (httpResponse.indexOf("200") != -1) {
    // Read response
    String response = sendATCommand("AT+HTTPREAD", 5000);
    
    // Parse JSON (simplified - you may need to improve this)
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error && doc.is<JsonArray>() && doc.size() > 0) {
      JsonObject vehicle = doc[0];
      if (vehicle.containsKey("id")) {
        vehicleId = vehicle["id"].as<String>();
      }
    }
  }
  
  // Terminate HTTP
  sendATCommand("AT+HTTPTERM", 2000);
  
  return vehicleId;
}

// ========== HELPER FUNCTIONS ==========
void printGPSInfo() {
  Serial.println("========== GPS INFO ==========");
  Serial.print("Location Valid: ");
  Serial.println(gps.location.isValid() ? "Yes" : "No");
  if (gps.location.isValid()) {
    Serial.print("Latitude: ");
    Serial.println(gps.location.lat(), 6);
    Serial.print("Longitude: ");
    Serial.println(gps.location.lng(), 6);
    Serial.print("Altitude: ");
    Serial.print(gps.altitude.meters());
    Serial.println(" m");
    Serial.print("Speed: ");
    Serial.print(gps.speed.kmph());
    Serial.println(" km/h");
    Serial.print("Heading: ");
    Serial.print(gps.course.deg());
    Serial.println(" degrees");
  }
  Serial.print("Satellites: ");
  Serial.println(gps.satellites.value());
  Serial.println("==============================");
}


