const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Lincoln, NE coordinates
const lat = 40.8136;
const lon = -96.7026;

// API URLs
const realtimeURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
const hourlyURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation,wind_gusts_10m,apparent_temperature,pressure_msl,wind_direction_10m,relative_humidity_2m,uv_index,wind_speed_10m`;

function celsiusToFahrenheit(celsius) {
  return (celsius * 9/5) + 32;
}

function kmhToMph(kmh) {
  return kmh * 0.621371;
}

function mmToInches(mm) {
  return mm * 0.0393701;
}

function hPaToInHg(hPa) {
  return hPa * 0.02953;
}

function degreesToCompass(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

async function getWeatherData() {
  try {
    console.log("Fetching real-time and hourly weather data...");
    const [realtimeRes, hourlyRes] = await Promise.all([
      axios.get(realtimeURL),
      axios.get(hourlyURL)
    ]);
    return {
      realtime: realtimeRes.data.current_weather,
      hourly: hourlyRes.data.hourly
    };
  } catch (error) {
    console.error('Error fetching weather data:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Temperature endpoint
app.get('/temperature', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');

  const { realtime } = data;
  const tempF = celsiusToFahrenheit(realtime.temperature);
  res.send(`${tempF.toFixed(1)}°F`);
});

// Wind Speed endpoint
app.get('/windspeed', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');

  const { hourly } = data;
  const windSpeedMph = kmhToMph(hourly.wind_speed_10m[0]);
  res.send(`${windSpeedMph.toFixed(1)} mph`);
});

// Wind Gusts endpoint
app.get('/windgusts', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');

  const { hourly } = data;
  const windGustsMph = kmhToMph(hourly.wind_gusts_10m[0]);
  res.send(`${windGustsMph.toFixed(1)} mph`);
});

// Rainfall endpoint
app.get('/rainfall', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');

  const { hourly } = data;
  const precipitationInches = mmToInches(hourly.precipitation[0]);
  res.send(`${precipitationInches.toFixed(2)} inches`);
});

// Humidity endpoint
app.get('/humidity', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');

  const { hourly } = data;
  const humidity = hourly.relative_humidity_2m[0];
  res.send(`${humidity}%`);
});

// Barometric Pressure endpoint
app.get('/pressure', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');

  const { hourly } = data;
  const pressureInHg = hPaToInHg(hourly.pressure_msl[0]);
  res.send(`${pressureInHg.toFixed(2)} inHg`);
});

// UV Index endpoint
app.get('/uv', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');

  const { hourly } = data;
  const uvIndex = hourly.uv_index[0];
  res.send(`${uvIndex.toFixed(1)}`);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
