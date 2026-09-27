const defaultCity = 'Detroit';
const favoriteCityKey = 'weatherApp.favoriteCity';
const wardrobeStorageKey = 'weatherApp.wardrobeItems';
const validWeatherTags = ['hot', 'warm', 'mild', 'cool', 'cold', 'rainy', 'sunny'];
const hasDocument = typeof document !== 'undefined';

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

const temperatureEl = hasDocument ? document.getElementById('temperature') : null;
const conditionEl = hasDocument ? document.getElementById('condition') : null;
const conditionIconEl = hasDocument ? document.getElementById('condition-icon') : null;
const outfitEl = hasDocument ? document.getElementById('outfit') : null;
const outfitGalleryEl = hasDocument ? document.getElementById('outfit-gallery') : null;
const weekForecastEl = hasDocument ? document.getElementById('week-forecast') : null;
const cityNameEl = hasDocument ? document.getElementById('city-name') : null;
const searchInput = hasDocument ? document.getElementById('city-search') : null;
const searchButton = hasDocument ? document.getElementById('search-btn') : null;
const favoriteButton = hasDocument ? document.getElementById('favorite-btn') : null;
const favoriteModal = hasDocument ? document.getElementById('favorite-modal') : null;
const favoriteForm = hasDocument ? document.getElementById('favorite-form') : null;
const favoriteCityInput = hasDocument ? document.getElementById('favorite-city-input') : null;
const favoriteCancelButton = hasDocument ? document.getElementById('favorite-cancel') : null;
const unitButtons = hasDocument ? document.querySelectorAll('.unit-btn') : [];

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
  if (!favoriteCityInput || !favoriteModal) return;
  favoriteCityInput.value = city;
  favoriteModal.classList.remove('hidden');
  favoriteCityInput.focus();
}

function hideFavoritePrompt() {
  if (!favoriteModal) return;
  favoriteModal.classList.add('hidden');
}

function initializeFavoriteCity() {
  if (!searchInput) return;

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

function getWeatherCategory(tempC) {
  if (tempC >= 30) return 'hot';
  if (tempC >= 25) return 'warm';
  if (tempC >= 18) return 'mild';
  if (tempC >= 10) return 'cool';
  return 'cold';
}

function isRainyWeather(weatherLabel = '') {
  const label = String(weatherLabel).toLowerCase();
  return ['rain', 'drizzle', 'showers', 'storm', 'fog', 'cloudy', 'mist'].some((word) => label.includes(word));
}

function inferWardrobeIcon(itemName, tags = []) {
  const lowerName = String(itemName || '').toLowerCase();

  if (tags.includes('cold') || lowerName.includes('coat') || lowerName.includes('jacket')) return '🧥';
  if (tags.includes('rainy') || lowerName.includes('rain') || lowerName.includes('hoodie')) return '🌧️';
  if (tags.includes('hot') || lowerName.includes('short') || lowerName.includes('tank') || lowerName.includes('tee')) return '👕';
  if (tags.includes('cool') || lowerName.includes('sweater') || lowerName.includes('sweat')) return '🧶';
  if (lowerName.includes('pants') || lowerName.includes('jean') || lowerName.includes('trouser')) return '👖';
  if (lowerName.includes('scarf')) return '🧣';
  if (lowerName.includes('boot')) return '🥾';
  return '🧥';
}

function normalizeWardrobeItem(item) {
  if (!item || typeof item !== 'object') return null;

  const trimmedName = String(item.name || '').trim();
  const weatherTags = Array.isArray(item.weatherTags)
    ? item.weatherTags.filter((tag) => validWeatherTags.includes(tag))
    : [];

  if (!trimmedName || !weatherTags.length) {
    return null;
  }

  const uniqueTags = [...new Set(weatherTags)];

  return {
    id: item.id || `wardrobe-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: trimmedName,
    weatherTags: uniqueTags,
    icon: item.icon || inferWardrobeIcon(trimmedName, uniqueTags)
  };
}

function getStoredWardrobe() {
  if (!hasDocument || !window.localStorage) {
    return [];
  }

  try {
    const storedItems = localStorage.getItem(wardrobeStorageKey);
    if (!storedItems) return [];

    const parsedItems = JSON.parse(storedItems);
    if (!Array.isArray(parsedItems)) return [];

    return parsedItems.map(normalizeWardrobeItem).filter(Boolean);
  } catch (error) {
    console.error('Unable to load wardrobe items:', error);
    return [];
  }
}

function saveWardrobe(items) {
  if (!hasDocument || !window.localStorage) {
    return;
  }

  try {
    localStorage.setItem(wardrobeStorageKey, JSON.stringify(items));
  } catch (error) {
    console.error('Unable to save wardrobe items:', error);
  }
}

function getOutfitSuggestion(tempC, code) {
  const weather = getWeatherDetails(code);
  const rainy = isRainyWeather(weather.label);

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
  const rainy = isRainyWeather(getWeatherDetails(code).label);

  if (tempC >= 30) return outfitItems.hot;
  if (tempC >= 25) return rainy ? outfitItems.warm : outfitItems.hot;
  if (tempC >= 18) return outfitItems.mild;
  if (tempC >= 10) return outfitItems.cool;
  if (tempC >= 0) return outfitItems.cold;
  return outfitItems.cold;
}

function getWardrobeSuggestions(items, tempC, weatherLabel = '') {
  if (typeof tempC !== 'number' || Number.isNaN(tempC)) {
    return [];
  }

  const normalized = (Array.isArray(items) ? items : [])
    .map(normalizeWardrobeItem)
    .filter(Boolean);

  if (!normalized.length) {
    return [];
  }

  const targetCategory = getWeatherCategory(tempC);
  const rainy = isRainyWeather(weatherLabel);

  const matches = normalized.filter((item) => {
    const tags = item.weatherTags || [];
    const matchesCategory = tags.includes(targetCategory);
    const matchesRain = rainy && tags.includes('rainy');
    return matchesCategory || matchesRain;
  });

  return matches.length ? matches : normalized;
}

function renderOutfitGallery() {
  if (!outfitGalleryEl || currentTempC === null) {
    return;
  }

  const weatherLabel = currentWeatherCode !== null ? getWeatherDetails(currentWeatherCode).label : '';
  const wardrobeMatches = getWardrobeSuggestions(getStoredWardrobe(), currentTempC, weatherLabel).map((item) => ({
    ...item,
    owned: true
  }));
  const defaultItems = getOutfitItemsForWeather(currentTempC, currentWeatherCode).map((item) => ({
    ...item,
    owned: false
  }));

  const seenNames = new Set();
  const items = [...wardrobeMatches, ...defaultItems].filter((item) => {
    const key = String(item.name || '').trim().toLowerCase();
    if (!key || seenNames.has(key)) {
      return false;
    }

    seenNames.add(key);
    return true;
  });

  outfitGalleryEl.innerHTML = items
    .map(
      (item) => `
        <article class="clothing-card" aria-label="${item.name}">
          <div class="clothing-icon" aria-hidden="true">${item.icon || inferWardrobeIcon(item.name, item.weatherTags || [])}</div>
          <div class="clothing-caption">
            <span>${item.name}</span>
            ${item.owned ? '<span class="owned-label">Owned</span>' : ''}
          </div>
        </article>
      `
    )
    .join('');
}

function renderWeather() {
  if (currentTempC === null || !temperatureEl || !conditionEl || !conditionIconEl || !outfitEl) {
    return;
  }

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
  if (!weekForecastEl) return;

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

  if (weekForecastEl && weekForecastEl.dataset.lastForecast) {
    renderWeeklyForecast(JSON.parse(weekForecastEl.dataset.lastForecast));
  }
}

function setCityName(name) {
  if (cityNameEl) {
    cityNameEl.textContent = name;
  }
}

async function fetchWeatherForCity(cityName) {
  if (!outfitEl || !temperatureEl || !conditionEl || !conditionIconEl || !weekForecastEl) return;

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
    if (outfitGalleryEl) outfitGalleryEl.innerHTML = '';
    weekForecastEl.innerHTML = '<div class="forecast-empty">Forecast is unavailable right now.</div>';
    console.error(error);
  }
}

function initializeWardrobePage() {
  const wardrobeForm = document.getElementById('wardrobe-form');
  const wardrobeList = document.getElementById('wardrobe-list');
  if (!wardrobeForm || !wardrobeList) return;

  const tagInputs = wardrobeForm.querySelectorAll('input[name="weather-tag"]');

  function renderWardrobeList() {
    const items = getStoredWardrobe();

    if (!items.length) {
      wardrobeList.innerHTML = '<div class="empty-state">No items yet. Add a shirt, coat, or other piece of clothing to start building your outfit ideas.</div>';
      return;
    }

    wardrobeList.innerHTML = items
      .map(
        (item) => `
          <div class="wardrobe-item" data-id="${item.id}">
            <div class="wardrobe-item-main">
              <div class="wardrobe-item-icon" aria-hidden="true">${item.icon}</div>
              <div>
                <h3>${item.name}</h3>
                <div class="tag-list">
                  ${item.weatherTags
                    .map((tag) => `<span class="weather-tag ${tag}">${tag}</span>`)
                    .join('')}
                </div>
              </div>
            </div>
            <button type="button" class="delete-item" data-item-id="${item.id}">Remove</button>
          </div>
        `
      )
      .join('');
  }

  wardrobeForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const clothingNameInput = document.getElementById('wardrobe-name');
    const clothingName = clothingNameInput ? clothingNameInput.value.trim() : '';
    const selectedTags = Array.from(tagInputs)
      .filter((input) => input.checked)
      .map((input) => input.value);

    if (!clothingName) {
      clothingNameInput.focus();
      return;
    }

    if (!selectedTags.length) {
      window.alert('Please choose at least one weather type for this item.');
      return;
    }

    const items = getStoredWardrobe();
    const newItem = normalizeWardrobeItem({
      id: `wardrobe-${Date.now()}`,
      name: clothingName,
      weatherTags: selectedTags,
      icon: inferWardrobeIcon(clothingName, selectedTags)
    });

    if (!newItem) {
      window.alert('Unable to add that clothing item.');
      return;
    }

    items.unshift(newItem);
    saveWardrobe(items);
    wardrobeForm.reset();
    renderWardrobeList();
  });

  wardrobeList.addEventListener('click', (event) => {
    const removeButton = event.target.closest('.delete-item');
    if (!removeButton) return;

    const itemId = removeButton.dataset.itemId;
    const items = getStoredWardrobe().filter((item) => item.id !== itemId);
    saveWardrobe(items);
    renderWardrobeList();
  });

  renderWardrobeList();
}

if (hasDocument && searchButton && favoriteButton && favoriteForm && favoriteCancelButton && searchInput) {
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
}

if (hasDocument && document.getElementById('wardrobe-form')) {
  initializeWardrobePage();
}

if (typeof module !== 'undefined') {
  module.exports = { getWardrobeSuggestions };
}
