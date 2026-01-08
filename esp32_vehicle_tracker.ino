/*
 * ESP32 Vehicle Tracker
 * GPS-based vehicle tracking system that sends location data to Supabase
 * 
 * Hardware Requirements:
 * - ESP32 Development Board
 * - NEO-6M or NEO-8M GPS Module
 * - Optional: Battery monitoring, GSM module for cellular connectivity
 * 
 * Libraries Required:
 * - WiFi (built-in)
 * - HTTPClient (built-in)
 * - TinyGPS++ (install from Library Manager)
 * - ArduinoJson (install from Library Manager)
 * 
 * Setup:
 * 1. Install required libraries
 * 2. Configure WiFi credentials
 * 3. Configure Supabase URL and API key
 * 4. Set DEVICE_ID (unique for each device)
 * 5. Upload to ESP32
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPS++.h>
#include <ArduinoJson.h>
#include <HardwareSerial.h>

// ========== CONFIGURATION ==========
// WiFi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase Configuration
const char* supabaseUrl = "https://your-project.supabase.co";
const char* supabaseKey = "your-anon-key-here";
const char* supabaseEndpoint = "/rest/v1/vehicle_locations";

// Device Configuration
const char* DEVICE_ID = "ESP32-001"; // Unique device identifier - CHANGE THIS FOR EACH DEVICE
const char* DEVICE_NAME = "Araç 1"; // Friendly device name

// GPS Configuration
#define GPS_RX_PIN 16  // GPS RX pin (connects to ESP32 TX)
#define GPS_TX_PIN 17  // GPS TX pin (connects to ESP32 RX)
#define GPS_BAUD 9600  // GPS module baud rate

// Update Interval (milliseconds)
const unsigned long UPDATE_INTERVAL = 30000; // Send location every 30 seconds
const unsigned long GPS_TIMEOUT = 10000;     // Wait max 10 seconds for GPS fix

// ========== GLOBAL VARIABLES ==========
HardwareSerial gpsSerial(1);
TinyGPS++ gps;
unsigned long lastUpdate = 0;
bool wifiConnected = false;

// ========== SETUP ==========
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("ESP32 Vehicle Tracker Starting...");
  Serial.println("Device ID: " + String(DEVICE_ID));
  
  // Initialize GPS
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("GPS Module Initialized");
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("Setup Complete!");
}

// ========== MAIN LOOP ==========
void loop() {
  // Maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    connectToWiFi();
  } else {
    wifiConnected = true;
  }
  
  // Read GPS data
  while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      // GPS data decoded successfully
    }
  }
  
  // Send location data at intervals
  unsigned long currentTime = millis();
  if (currentTime - lastUpdate >= UPDATE_INTERVAL) {
    if (wifiConnected && gps.location.isValid()) {
      sendLocationToSupabase();
      lastUpdate = currentTime;
    } else {
      if (!wifiConnected) {
        Serial.println("WiFi not connected, skipping update");
      }
      if (!gps.location.isValid()) {
        Serial.println("GPS not fixed, skipping update");
        Serial.print("Satellites: ");
        Serial.println(gps.satellites.value());
      }
    }
  }
  
  delay(100);
}

// ========== WIFI CONNECTION ==========
void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    wifiConnected = true;
  } else {
    Serial.println();
    Serial.println("WiFi Connection Failed!");
    wifiConnected = false;
  }
}

// ========== SEND LOCATION TO SUPABASE ==========
void sendLocationToSupabase() {
  if (!gps.location.isValid()) {
    Serial.println("Invalid GPS location, skipping send");
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
  
  // Calculate accuracy (rough estimate based on satellite count)
  double accuracy = 10.0; // Default 10 meters
  if (satellites > 0) {
    accuracy = 50.0 / satellites; // Better accuracy with more satellites
  }
  
  // Get battery level (if you have battery monitoring)
  int batteryLevel = 100; // Default to 100, implement actual reading if available
  // batteryLevel = readBatteryLevel(); // Implement this function
  
  // Get WiFi signal strength
  int signalStrength = 0;
  if (WiFi.status() == WL_CONNECTED) {
    int rssi = WiFi.RSSI();
    // Convert RSSI (-100 to 0) to percentage (0 to 100)
    signalStrength = constrain(map(rssi, -100, 0, 0, 100), 0, 100);
  }
  
  // First, we need to get the vehicle_id from the device_id using RPC function
  HTTPClient http;
  String url = String(supabaseUrl) + "/rest/v1/rpc/get_vehicle_by_device_id";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  http.addHeader("Prefer", "return=representation");
  
  // Call RPC function with device_id parameter
  DynamicJsonDocument requestDoc(256);
  requestDoc["p_device_id"] = DEVICE_ID;
  String deviceQuery;
  serializeJson(requestDoc, deviceQuery);
  
  int httpResponseCode = http.POST(deviceQuery);
  
  String vehicleId = "";
  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Vehicle found: " + response);
    
    // Parse JSON response (RPC returns array)
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error && doc.is<JsonArray>() && doc.size() > 0) {
      JsonObject vehicle = doc[0];
      if (vehicle.containsKey("id")) {
        vehicleId = vehicle["id"].as<String>();
        Serial.println("Vehicle ID: " + vehicleId);
      }
    } else if (!error && doc.is<JsonObject>() && doc.containsKey("id")) {
      vehicleId = doc["id"].as<String>();
      Serial.println("Vehicle ID: " + vehicleId);
    }
  } else {
    Serial.print("Error getting vehicle ID: ");
    Serial.println(httpResponseCode);
    Serial.println(http.getString());
    http.end();
    return;
  }
  http.end();
  
  if (vehicleId == "") {
    Serial.println("Vehicle ID not found for device: " + String(DEVICE_ID));
    Serial.println("Please register this device in the web dashboard first!");
    return;
  }
  
  // Now send location data
  url = String(supabaseUrl) + String(supabaseEndpoint);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  http.addHeader("Prefer", "return=representation");
  
  // Create JSON payload
  // Note: timestamp will be set automatically by database, so we don't include it
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
  // timestamp is set automatically by database DEFAULT NOW()
  
  String jsonPayload;
  serializeJson(locationDoc, jsonPayload);
  
  Serial.println("Sending location data...");
  Serial.println(jsonPayload);
  
  httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode == 200 || httpResponseCode == 201) {
    Serial.println("Location sent successfully!");
    String response = http.getString();
    Serial.println("Response: " + response);
  } else {
    Serial.print("Error sending location: ");
    Serial.println(httpResponseCode);
    Serial.println(http.getString());
  }
  
  http.end();
}

// ========== HELPER FUNCTIONS ==========
// Implement battery level reading if you have battery monitoring hardware
/*
int readBatteryLevel() {
  // Read from ADC pin connected to battery voltage divider
  // Adjust based on your hardware setup
  int adcValue = analogRead(BATTERY_PIN);
  float voltage = (adcValue / 4095.0) * 3.3 * 2; // Adjust multiplier based on voltage divider
  int percentage = map(voltage, 3.0, 4.2, 0, 100); // Adjust for your battery
  return constrain(percentage, 0, 100);
}
*/

// Print GPS info for debugging
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
  Serial.print("HDOP: ");
  Serial.println(gps.hdop.value());
  Serial.println("==============================");
}

