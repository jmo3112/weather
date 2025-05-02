const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Lincoln, NE coordinates
const lat = 40.8136;
const lon = -96.7026;

// API URLs
const realtimeURL = https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true;
const hourlyURL = https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation,wind_gusts_10m,apparent_temperature,pressure_msl,wind_direction_10m,relative_humidity_2m,uv_index,wind_speed_10m;

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

// Individual widget endpoints
app.get('/temperature', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');
  const tempF = celsiusToFahrenheit(data.realtime.temperature);
  res.send(${tempF.toFixed(1)}°F);
});

app.get('/windspeed', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');
  const windSpeedMph = kmhToMph(data.hourly.wind_speed_10m[0]);
  res.send(${windSpeedMph.toFixed(1)} mph);
});

app.get('/windgusts', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');
  const windGustsMph = kmhToMph(data.hourly.wind_gusts_10m[0]);
  res.send(${windGustsMph.toFixed(1)} mph);
});

app.get('/rainfall', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');
  const precipitationInches = mmToInches(data.hourly.precipitation[0]);
  res.send(${precipitationInches.toFixed(2)} inches);
});

app.get('/humidity', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');
  const humidity = data.hourly.relative_humidity_2m[0];
  res.send(${humidity}%);
});

app.get('/pressure', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');
  const pressureInHg = hPaToInHg(data.hourly.pressure_msl[0]);
  res.send(${pressureInHg.toFixed(2)} inHg);
});

app.get('/uv', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');
  const uvIndex = data.hourly.uv_index[0];
  res.send(${uvIndex.toFixed(1)});
});

// JSON endpoint for SharpTools
app.get('/data', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.status(500).send({ error: 'Weather fetch failed' });

  const { realtime, hourly } = data;

  const tempF = celsiusToFahrenheit(realtime.temperature);
  const apparentTempF = celsiusToFahrenheit(hourly.apparent_temperature[0]);
  const windSpeedMph = kmhToMph(hourly.wind_speed_10m[0]);
  const windGustsMph = kmhToMph(hourly.wind_gusts_10m[0]);
  const windDirection = degreesToCompass(realtime.winddirection);
  const precipitationInches = mmToInches(hourly.precipitation[0]);
  const humidity = hourly.relative_humidity_2m[0];
  const pressureInHg = hPaToInHg(hourly.pressure_msl[0]);
  const uvIndex = hourly.uv_index[0];

  res.json({
    tempF: tempF.toFixed(1),
    apparentTempF: apparentTempF.toFixed(1),
    windSpeedMph: windSpeedMph.toFixed(1),
    windGustsMph: windGustsMph.toFixed(1),
    windDirection,
    humidity,
    pressureInHg: pressureInHg.toFixed(2),
    precipitationInches: precipitationInches.toFixed(2),
    uvIndex: uvIndex.toFixed(1)
  });
});

// Main page route with HTML summary
app.get('/', async (req, res) => {
  const data = await getWeatherData();
  if (!data) return res.send('Error fetching weather data.');

  const { realtime, hourly } = data;

  const tempF = celsiusToFahrenheit(realtime.temperature);
  const apparentTempF = celsiusToFahrenheit(hourly.apparent_temperature[0]);
  const windSpeedMph = kmhToMph(hourly.wind_speed_10m[0]);
  const windGustsMph = kmhToMph(hourly.wind_gusts_10m[0]);
  const windDirection = degreesToCompass(realtime.winddirection);
  const precipitationInches = mmToInches(hourly.precipitation[0]);
  const humidity = hourly.relative_humidity_2m[0];
  const pressureInHg = hPaToInHg(hourly.pressure_msl[0]);
  const uvIndex = hourly.uv_index[0];

  const htmlContent = 
    <html>
      <head>
        <title>Weather Dashboard - Lincoln, NE</title>
        <meta http-equiv="refresh" content="300">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f9f9f9; }
          h1 { color: #333; }
          .widget { margin: 10px 0; padding: 12px; border: 1px solid #ccc; border-radius: 8px; background: #fff; }
        </style>
      </head>
      <body>
        <h1>Weather Dashboard - Lincoln, NE</h1>
        <div class="widget"><strong>Temperature (real-time):</strong> ${tempF.toFixed(1)}°F</div>
        <div class="widget"><strong>Apparent Temperature:</strong> ${apparentTempF.toFixed(1)}°F</div>
        <div class="widget"><strong>Wind Speed (forecast):</strong> ${windSpeedMph.toFixed(1)} mph</div>
        <div class="widget"><strong>Wind Gusts:</strong> ${windGustsMph.toFixed(1)} mph</div>
        <div class="widget"><strong>Wind Direction:</strong> ${windDirection} (${realtime.winddirection}°)</div>
        <div class="widget"><strong>Rainfall (last hour):</strong> ${precipitationInches.toFixed(2)} inches</div>
        <div class="widget"><strong>Relative Humidity:</strong> ${humidity}%</div>
        <div class="widget"><strong>Barometric Pressure:</strong> ${pressureInHg.toFixed(2)} inHg</div>
        <div class="widget"><strong>UV Index:</strong> ${uvIndex.toFixed(1)}</div>
      </body>
    </html>
  ;

  res.send(htmlContent);
});

// Start the server
app.listen(PORT, () => {
  console.log(Server is running on port ${PORT});
});
