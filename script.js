const defaultCity = 'Detroit';
const favoriteCityKey = 'weatherApp.favoriteCity';
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

const outfitItems = {
  hot: [
    { name: 'Tank top', icon: '👕' },
    { name: 'Shorts', icon: '🩳' },
    { name: 'Sunglasses', icon: '🕶️' }
  ],
  warm: [
    { name: 'Breathable tee', icon: '👚' },
    { name: 'Light shorts', icon: '🩱' },
    { name: 'Light rain jacket', icon: '🧥' }
  ],
  mild: [
    { name: 'Long-sleeve tee', icon: '👕' },
    { name: 'Denim jeans', icon: '👖' },
    { name: 'Light layer', icon: '🧣' }
  ],
  cool: [
    { name: 'Sweater', icon: '🧶' },
    { name: 'Jeans', icon: '👖' },
    { name: 'Light coat', icon: '🧥' }
  ],
  cold: [
    { name: 'Winter coat', icon: '🧥' },
    { name: 'Scarf', icon: '🧣' },
    { name: 'Boots', icon: '🥾' }
  ]
};

const temperatureEl = document.getElementById('temperature');
const conditionEl = document.getElementById('condition');
const conditionIconEl = document.getElementById('condition-icon');
const outfitEl = document.getElementById('outfit');
const outfitGalleryEl = document.getElementById('outfit-gallery');
const weekForecastEl = document.getElementById('week-forecast');
const cityNameEl = document.getElementById('city-name');
const searchInput = document.getElementById('city-search');
const searchButton = document.getElementById('search-btn');
const favoriteButton = document.getElementById('favorite-btn');
const favoriteModal = document.getElementById('favorite-modal');
const favoriteForm = document.getElementById('favorite-form');
const favoriteCityInput = document.getElementById('favorite-city-input');
const favoriteCancelButton = document.getElementById('favorite-cancel');
const unitButtons = document.querySelectorAll('.unit-btn');

let currentTempC = null;
let currentWeatherCode = null;
let activeUnit = 'c';

function getFavoriteCity() {
  try {
    return localStorage.getItem(favoriteCityKey) || '';
  } catch (error) {
    console.error('Unable to read saved favorite city:', error);
    return '';
  }
}

function saveFavoriteCity(cityName) {
  const trimmedCity = cityName.trim();

  if (!trimmedCity) {
    return false;
  }

  try {
    localStorage.setItem(favoriteCityKey, trimmedCity);
    return true;
  } catch (error) {
    console.error('Unable to save favorite city:', error);
    return false;
  }
}

function showFavoritePrompt(city = defaultCity) {
  favoriteCityInput.value = city;
  favoriteModal.classList.remove('hidden');
  favoriteCityInput.focus();
}

function hideFavoritePrompt() {
  favoriteModal.classList.add('hidden');
}

function initializeFavoriteCity() {
  const savedFavorite = getFavoriteCity();

  if (savedFavorite) {
    searchInput.value = savedFavorite;
    fetchWeatherForCity(savedFavorite);
    return;
  }

  showFavoritePrompt(defaultCity);
}

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

function getOutfitItemsForWeather(tempC, code) {
  const rainy = ['rain', 'drizzle', 'showers', 'storm', 'fog', 'cloudy'].some((word) =>
    getWeatherDetails(code).label.toLowerCase().includes(word)
  );

  if (tempC >= 30) return outfitItems.hot;
  if (tempC >= 25) return rainy ? outfitItems.warm : outfitItems.hot;
  if (tempC >= 18) return rainy ? outfitItems.mild : outfitItems.mild;
  if (tempC >= 10) return outfitItems.cool;
  if (tempC >= 0) return outfitItems.cold;
  return outfitItems.cold;
}

function renderOutfitGallery() {
  if (currentTempC === null) {
    outfitGalleryEl.innerHTML = '';
    return;
  }

  const items = getOutfitItemsForWeather(currentTempC, currentWeatherCode);
  outfitGalleryEl.innerHTML = items
    .map(
      (item) => `
        <article class="clothing-card" aria-label="${item.name}">
          <div class="clothing-icon" aria-hidden="true">${item.icon}</div>
          <div class="clothing-caption">
            <span>${item.name}</span>
          </div>
        </article>
      `
    )
    .join('');
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
  renderOutfitGallery();
}

function formatDayLabel(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
}

function renderWeeklyForecast(daily) {
  if (!daily || !daily.time || !daily.time.length) {
    weekForecastEl.innerHTML = '<div class="forecast-empty">Forecast unavailable for this city.</div>';
    return;
  }

  weekForecastEl.innerHTML = daily.time
    .slice(0, 7)
    .map((day, index) => {
      const code = daily.weather_code[index];
      const high = daily.temperature_2m_max[index];
      const low = daily.temperature_2m_min[index];
      const weather = getWeatherDetails(code);
      const displayHigh = activeUnit === 'c' ? high : toFahrenheit(high);
      const displayLow = activeUnit === 'c' ? low : toFahrenheit(low);
      const unitLabel = activeUnit === 'c' ? '°C' : '°F';

      return `
        <article class="forecast-card">
          <p class="forecast-day">${formatDayLabel(day)}</p>
          <div class="forecast-icon" aria-hidden="true">${weather.icon}</div>
          <p class="forecast-condition">${weather.label}</p>
          <p class="forecast-temp">${Math.round(displayHigh)}${unitLabel} / ${Math.round(displayLow)}${unitLabel}</p>
        </article>
      `;
    })
    .join('');
}

function updateUnit(unit) {
  activeUnit = unit;
  unitButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.unit === unit);
  });
  renderWeather();

  if (weekForecastEl.dataset.lastForecast) {
    renderWeeklyForecast(JSON.parse(weekForecastEl.dataset.lastForecast));
  }
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

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
    const response = await fetch(forecastUrl);

    if (!response.ok) {
      throw new Error('Unable to fetch weather data.');
    }

    const data = await response.json();
    currentTempC = data.current.temperature_2m;
    currentWeatherCode = data.current.weather_code;
    renderWeather();
    renderWeeklyForecast(data.daily);
    weekForecastEl.dataset.lastForecast = JSON.stringify(data.daily);
  } catch (error) {
    temperatureEl.textContent = '--°';
    conditionEl.textContent = 'Weather unavailable';
    conditionIconEl.textContent = '⚠️';
    outfitEl.textContent = 'Check back later for your outfit suggestion.';
    outfitGalleryEl.innerHTML = '';
    weekForecastEl.innerHTML = '<div class="forecast-empty">Forecast is unavailable right now.</div>';
    console.error(error);
  }
}

unitButtons.forEach((button) => {
  button.addEventListener('click', () => updateUnit(button.dataset.unit));
});

searchButton.addEventListener('click', () => {
  fetchWeatherForCity(searchInput.value);
});

favoriteButton.addEventListener('click', () => {
  const cityName = searchInput.value.trim();

  if (!cityName) {
    window.alert('Please enter a city before saving it as your favorite.');
    return;
  }

  if (saveFavoriteCity(cityName)) {
    window.alert(`Saved ${cityName} as your favorite city.`);
  }
});

favoriteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const cityName = favoriteCityInput.value.trim();

  if (!cityName) {
    favoriteCityInput.focus();
    return;
  }

  saveFavoriteCity(cityName);
  searchInput.value = cityName;
  hideFavoritePrompt();
  fetchWeatherForCity(cityName);
});

favoriteCancelButton.addEventListener('click', () => {
  const fallbackCity = defaultCity;
  saveFavoriteCity(fallbackCity);
  searchInput.value = fallbackCity;
  hideFavoritePrompt();
  fetchWeatherForCity(fallbackCity);
});

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    fetchWeatherForCity(searchInput.value);
  }
});

initializeFavoriteCity();
