const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-btn");
const locationButton = document.getElementById("location-btn");
const currentWeatherDiv = document.getElementById("current-weather");
const weatherCardsDiv = document.getElementById("weather-cards");
const recentCitiesDropdown = document.getElementById("recent-cities-dropdown");
const recentCitiesContainer = document.getElementById("recent-cities-container");
const dropdownBtn = document.getElementById("dropdown-btn");

const API_KEY = "28b75d8907b3753af735eb8cb1a48fee"; // OpenWeatherMap API Key
let recentCities = JSON.parse(localStorage.getItem("recentCities")) || [];

// Load recent cities on page load
function loadRecentCities() {
    if (recentCities.length > 0) {
        recentCitiesContainer.classList.remove("hidden");
        recentCitiesDropdown.innerHTML = recentCities.map((city) => `<li class="p-2 hover:bg-gray-200 cursor-pointer">${city}</li>`).join("");
    }
}

// Store the city in local storage and refresh the dropdown
function storeCity(cityName) {
    if (!recentCities.includes(cityName)) {
        recentCities.push(cityName);
        if (recentCities.length > 5) recentCities.shift(); // Store only last 5 cities
        localStorage.setItem("recentCities", JSON.stringify(recentCities));
    }
    loadRecentCities();
}

// Fetch weather data for the searched city
function getWeatherDetails(cityName, latitude, longitude) {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL)
        .then(response => response.json())
        .then(data => {
            const uniqueForecastDays = [];
            const fiveDaysForecast = data.list.filter(forecast => {
                const forecastDate = new Date(forecast.dt_txt).getDate();
                if (!uniqueForecastDays.includes(forecastDate)) {
                    return uniqueForecastDays.push(forecastDate);
                }
            });

            cityInput.value = "";
            currentWeatherDiv.innerHTML = "";
            weatherCardsDiv.innerHTML = "";

            fiveDaysForecast.forEach((weatherItem, index) => {
                const html = createWeatherCard(cityName, weatherItem, index);
                if (index === 0) {
                    currentWeatherDiv.insertAdjacentHTML("beforeend", html);
                } else {
                    weatherCardsDiv.insertAdjacentHTML("beforeend", html);
                }
            });
        });
}

// Create weather card for the forecast data
function createWeatherCard(cityName, weatherItem, index) {
    if (index === 0) {
        return `<div id="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h6>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </div>
                <div id="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="weather-icon">
                    <h6>${weatherItem.weather[0].description}</h6>
                </div>`;
    } else {
        return `<li class="bg-gray-600 text-white p-4 rounded-lg">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="weather-icon">
                    <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </li>`;
    }
}

// Get city coordinates and weather details
function getCityCoordinates() {
    const cityName = cityInput.value.trim();
    if (cityName === "") return;
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            if (!data.length) return alert(`No coordinates found for ${cityName}`);
            const { lat, lon, name } = data[0];
            getWeatherDetails(name, lat, lon);
            storeCity(name); // Store city after search
        });
}

// Get user's current location and weather details
function getLocationAndWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;

            // Get the city name using reverse geocoding
            const reverseGeoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

            fetch(reverseGeoUrl)
                .then(response => response.json())
                .then(data => {
                    if (data.length > 0) {
                        const cityName = data[0].name; // Get city name from response
                        getWeatherDetails(cityName, latitude, longitude); // Fetch weather details using the city name
                    } else {
                        alert("Unable to determine the name of your location.");
                    }
                })
                .catch(error => {
                    alert(`Error retrieving location name: ${error.message}`);
                });

        }, () => {
            alert("Unable to retrieve your location.");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Handle dropdown click for recent cities
dropdownBtn.addEventListener("click", () => {
    recentCitiesDropdown.classList.toggle("hidden");
});

recentCitiesDropdown.addEventListener("click", (event) => {
    if (event.target.tagName === "LI") {
        const cityName = event.target.textContent;
        cityInput.value = cityName;
        getCityCoordinates();
    }
});

// Event listeners
searchButton.addEventListener("click", getCityCoordinates);
locationButton.addEventListener("click", getLocationAndWeather);

// Add the Enter key listener
cityInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
        getCityCoordinates(); // Trigger search on Enter key press
    }
});

// Initial load of recent cities
loadRecentCities();
