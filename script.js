
const apiEndpoint = 'https://api.open-meteo.com/v1/forecast';
const geocodeEndpoint = 'https://geocoding-api.open-meteo.com/v1/search';

document.getElementById('fetchWeather').addEventListener('click', fetchWeatherData);


// Function to filter data for the current date (today)
function filterDataForToday(data) {
    const now = new Date();
    // start of the current day
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    // start of the next day, to be insure that data is included from current day not next day
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    return {
        hourly: {
            time: data.hourly.time.filter(time => {
                return time >= todayStart && time < tomorrowStart;
            }),
            temperature_2m: data.hourly.temperature_2m.filter((_, index) => {
                return data.hourly.time[index] >= todayStart && data.hourly.time[index] < tomorrowStart;
            }),
            weathercode: data.hourly.weathercode.filter((_, index) => {
                return data.hourly.time[index] >= todayStart && data.hourly.time[index] < tomorrowStart;
            })
        }
    };
}

function fetchWeatherData() {
    const city = document.getElementById('city').value.trim();
    
    if (!city) {
        alert('Please enter a city name.');
        return;
    }

    const currentTime = new Date().toISOString(); // Capture current time

    fetch(`${geocodeEndpoint}?name=${city}`)
        .then(response => response.json())
        .then(data => {
            if (!data.results || data.results.length === 0) {
                alert('City not found.');
                return;
            }

            const { latitude, longitude } = data.results[0];
            // return fetch(`${apiEndpoint}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&forecast_days=16`);
            return fetch(`${apiEndpoint}?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
      
        })
        .then(response => response.json())
        .then(data => {

              // Check if daily data exists
              if (!data.daily) {
                alert('Daily forecast data is not available.');
                return;
            }

            if (data.error) {
                alert('Error fetching weather data.');
                return;
            }

            // Filter data to show from the current time
            const filteredData = filterDataFromCurrentTime(data, currentTime);

            displayCondition(filteredData);
            displayTemperatureChart(filteredData);
            displayMultiDayForecast(data);
        })
        .catch(error => alert('An error occurred: ' + error.message));
}

function filterDataFromCurrentTime(data, currentTime) {
    const now = new Date(currentTime);
    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(now.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    return {
        hourly: {
            time: data.hourly.time.filter(time => {
                const date = new Date(time);
                return date >= now && date < tomorrowStart;
            }),
            temperature_2m: data.hourly.temperature_2m.filter((_, index) => {
                const date = new Date(data.hourly.time[index]);
                return date >= now && date < tomorrowStart;
            }),
            weathercode: data.hourly.weathercode.filter((_, index) => {
                const date = new Date(data.hourly.time[index]);
                return date >= now && date < tomorrowStart;
            })
        }
    };
}


function displayTemperatureChart(data) {
    console.log('here', data)
    const temperatures = data.hourly.temperature_2m;
    const times = data.hourly.time.map(time => {
        const date = new Date(time);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    const ctx = document.getElementById('temperatureChart').getContext('2d');

    if (window.temperatureChart && window.temperatureChart.destroy) {
        window.temperatureChart.destroy();
    }

    window.temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.2)',
                fill: true,
                borderWidth: 12,
                tension: 0.1,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    },
                    title: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    },
                    title: {
                        display: false // Hide y-axis title
                    },
                    ticks: {
                        display: true // Remove y-axis grid lines
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#000',
                    titleColor: '#FFF',
                    bodyColor: '#FFF',
                    borderColor: '#000',
                    borderWidth: 12,
                    callbacks: {
                        label: function(context) {
                            // const date = new Date(context.label);
                            // const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return `🌡️ ${context.raw}°C`;
                        }
                    }
                },           
                title: {
                    display: false
                }
            }
        }
    });
}

// current day (today's forcast) functionailty
function displayCondition(data) {
    const conditions = data.hourly.weathercode;
    const times = data.hourly.time;

    let conditionHtml = '';
    times.forEach((time, index) => {
        const conditionText = getConditionText(conditions[index]); //might use it later
        const conditionEmoji = getConditionEmoji(conditions[index]);
        conditionHtml += `
            <div class="condition-item">
                <span class="condition-emoji">${conditionEmoji}</span>
               
                <div class="time">${new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
    });

    document.getElementById('conditionDisplay').innerHTML = conditionHtml;
}

function displayMultiDayForecast(data) {
    // Ensure data for the week is present
    const dailyTemperaturesMax = data.daily.temperature_2m_max || [];
    const dailyTemperaturesMin = data.daily.temperature_2m_min || [];
    const dailyWeather = data.daily.weathercode || [];
    const days = data.daily.time || [];
    
    // Get today's date
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Current date in YYYY-MM-DD
    today.setHours(0, 0, 0, 0); // Set time to start of the day for accurate comparison
    console.log('Today:', todayString);

    // Filter days to include only today and the next 7 days
    const forecastDays = [];
    for (let i = 0; i < days.length; i++) {
        const day = new Date(days[i]);
        day.setHours(0, 0, 0, 0); // Set time to start of the day for accurate comparison
        if (day >= today) {
            forecastDays.push(days[i]);
            if (forecastDays.length === 7) break; // Stop after 7 days
        }
    }
    console.log('Filtered Forecast Days:', forecastDays);

    let forecastHtml = '';
    
    forecastDays.forEach((day, index) => {
        // Get index of the filtered day in the original data
        const originalIndex = days.indexOf(day);

        const date = new Date(day);
        const dayName = date.toLocaleDateString([], { weekday: 'long' });
        const tempMax = dailyTemperaturesMax[originalIndex] !== undefined ? dailyTemperaturesMax[originalIndex] : 'N/A';
        const tempMin = dailyTemperaturesMin[originalIndex] !== undefined ? dailyTemperaturesMin[originalIndex] : 'N/A';
        const weatherEmoji = getConditionEmoji(dailyWeather[originalIndex]);

        forecastHtml += `
            <div class="forecast-item">
                <h3>${dayName}</h3>
                <div class="forecast-emoji">${weatherEmoji}</div>
                <div class="forecast-temp">🔺 ${tempMax}°C</div>
                <div class="forecast-temp">🔻 ${tempMin}°C</div>
            </div>
        `;
    });

    document.getElementById('forecastDisplay').innerHTML = forecastHtml;
}

function getConditionEmoji(code) {
    switch (code) {
        case 0: return '☀️'; // Clear sky
        case 1: case 2: case 3: return '🌤️'; // Mainly clear, partly cloudy, overcast
        case 45: case 48: return '🌫️'; // Fog
        case 51: case 53: case 55: return '🌦️'; // Drizzle
        case 56: case 57: return '🌨️'; // Freezing Drizzle
        case 61: case 63: case 65: return '🌧️'; // Rain
        case 66: case 67: return '🌨️'; // Freezing Rain
        case 71: case 73: case 75: return '🌨️'; // Snow fall
        case 77: return '🌨️'; // Snow grains
        case 80: case 81: case 82: return '🌦️'; // Rain showers
        case 85: case 86: return '🌨️'; // Snow showers
        case 95: return '⛈️'; // Thunderstorm
        case 96: case 99: return '⛈️'; // Thunderstorm with hail
        default: return '🌥️'; // Default
    }
}

function getConditionText(code) {
    switch (code) {
        case 0: return 'Clear sky';
        case 1: return 'Mainly clear';
        case 2: return 'Partly cloudy';
        case 3: return 'Overcast';
        case 45: return 'Fog';
        case 51: return 'Light rain showers';
        case 53: return 'Moderate rain showers';
        case 55: return 'Heavy rain showers';
        case 61: return 'Light rain';
        case 63: return 'Moderate rain';
        case 65: return 'Heavy rain';
        case 71: return 'Light snow showers';
        case 73: return 'Moderate snow showers';
        case 75: return 'Heavy snow showers';
        case 80: return 'Light rain showers';
        case 81: return 'Moderate rain showers';
        case 82: return 'Heavy rain showers';
        default: return 'Unknown';
    }
}


function openTab(tabName) {
    const tabs = document.querySelectorAll('.tabcontent');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    const tablinks = document.querySelectorAll('.tablink');
    tablinks.forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`.tablink[onclick="openTab('${tabName}')"]`).classList.add('active');
}

// Open the 'today's temp' (first) tab by default
document.addEventListener('DOMContentLoaded', () => {
    openTab('condition');
});