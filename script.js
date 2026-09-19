const defaultCity = 'Detroit';
const weatherCodeMap = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy drizzle', icon: '🌧️' },
  56: { label: 'Freezing drizzle', icon: '🌧️' },
  57: { label: 'Heavy freezing drizzle', icon: '🌧️' },
  61: { label: 'Light rain', icon: '🌦️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Freezing rain', icon: '🌧️' },
  67: { label: 'Heavy freezing rain', icon: '🌧️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '❄️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '❄️' },
  80: { label: 'Rain showers', icon: '🌦️' },
  81: { label: 'Heavy showers', icon: '🌧️' },
  82: { label: 'Violent showers', icon: '⛈️' },
  85: { label: 'Snow showers', icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '❄️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with hail', icon: '⛈️' },
  99: { label: 'Severe hail storm', icon: '⛈️' }
};

const temperatureEl = document.getElementById('temperature');
const conditionEl = document.getElementById('condition');
const conditionIconEl = document.getElementById('condition-icon');
const outfitEl = document.getElementById('outfit');
const cityNameEl = document.getElementById('city-name');
const searchInput = document.getElementById('city-search');
const searchButton = document.getElementById('search-btn');
const unitButtons = document.querySelectorAll('.unit-btn');

let currentTempC = null;
let currentWeatherCode = null;
let activeUnit = 'c';

function toFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

function getWeatherDetails(code) {
  return weatherCodeMap[code] || { label: 'Weather update', icon: '🌤️' };
}

function getOutfitSuggestion(tempC, code) {
  const weather = getWeatherDetails(code);
  const rainy = ['rain', 'drizzle', 'showers', 'storm', 'fog', 'cloudy'].some((word) =>
    weather.label.toLowerCase().includes(word)
  );

  if (tempC >= 30) {
    return 'Very hot out: wear a tank top, shorts, sunglasses, and a water bottle.';
  }

  if (tempC >= 25) {
    return rainy
      ? 'Warm and a bit wet: go with a breathable tee, light shorts, and a compact rain jacket.'
      : 'Warm day: a T-shirt, shorts, and comfortable sneakers are a great choice.';
  }

  if (tempC >= 18) {
    return rainy
      ? 'Mild weather: wear a light long-sleeve shirt, jeans, and a light rain layer.'
      : 'Comfortable weather: a T-shirt and light jacket or hoodie will feel just right.';
  }

  if (tempC >= 10) {
    return 'Cool outside: layer up with a sweater, jeans, and a light coat.';
  }

  if (tempC >= 0) {
    return 'Cold day: choose a warm coat, scarf, gloves, and closed-toe shoes.';
  }

  return 'Freezing conditions: wear a heavy winter coat, thermal layers, hat, gloves, and insulated boots.';
}

function renderWeather() {
  if (currentTempC === null) return;

  const tempDisplay = activeUnit === 'c' ? currentTempC : toFahrenheit(currentTempC);
  const unitLabel = activeUnit === 'c' ? '°C' : '°F';
  const weather = getWeatherDetails(currentWeatherCode);

  temperatureEl.textContent = `${Math.round(tempDisplay)}${unitLabel}`;
  conditionEl.textContent = weather.label;
  conditionIconEl.textContent = weather.icon;
  outfitEl.textContent = getOutfitSuggestion(currentTempC, currentWeatherCode);
}

function updateUnit(unit) {
  activeUnit = unit;
  unitButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.unit === unit);
  });
  renderWeather();
}

function setCityName(name) {
  cityNameEl.textContent = name;
}

async function fetchWeatherForCity(cityName) {
  const cityQuery = cityName.trim();
  if (!cityQuery) {
    outfitEl.textContent = 'Please enter a city name to get an outfit suggestion.';
    return;
  }

  try {
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=1&language=en&format=json`;
    const geocodeResponse = await fetch(geocodeUrl);

    if (!geocodeResponse.ok) {
      throw new Error('Unable to find that city.');
    }

    const geocodeData = await geocodeResponse.json();
    const location = geocodeData.results && geocodeData.results[0];

    if (!location) {
      throw new Error('No matching city found.');
    }

    const locationName = [location.name, location.admin1, location.country]
      .filter(Boolean)
      .join(', ');

    setCityName(locationName);

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code&timezone=auto`;
    const response = await fetch(forecastUrl);

    if (!response.ok) {
      throw new Error('Unable to fetch weather data.');
    }

    const data = await response.json();
    currentTempC = data.current.temperature_2m;
    currentWeatherCode = data.current.weather_code;
    renderWeather();
  } catch (error) {
    temperatureEl.textContent = '--°';
    conditionEl.textContent = 'Weather unavailable';
    conditionIconEl.textContent = '⚠️';
    outfitEl.textContent = 'Check back later for your outfit suggestion.';
    console.error(error);
  }
}

unitButtons.forEach((button) => {
  button.addEventListener('click', () => updateUnit(button.dataset.unit));
});

searchButton.addEventListener('click', () => {
  fetchWeatherForCity(searchInput.value);
});

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    fetchWeatherForCity(searchInput.value);
  }
});

searchInput.value = defaultCity;
fetchWeatherForCity(defaultCity);
