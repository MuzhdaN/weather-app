## weather-app


This is a weather app that shows the weather condition and temperature graph for today. It also shows the weather forcast for the upcoming days starting from current day. Live website [here](https://muzhdan.github.io/weather-app/)


## Features

- **Current Weather**: Displays the current weather conditions hourly for the day with weather emoji, and time. (the hours might be different based on the API response)
- **Temperature Chart**: Shows a line chart of hourly temperatures for the current day.
- **7-Day Forecast**: Provides a 7-day weather forecast with maximum and minimum temperatures.
- **Responsive Design**: The application is responsive in laptops and mobile devices.

## Api Integration
The app uses the Open [Meteo API](https://open-meteo.com/en/docs) for fetching weather data:

- Current Weather: /v1/forecast
- Geocoding: /v1/search

## Technology and tools
- HTML 
- CSS
- Javascript
- [Chart.js](https://www.chartjs.org/docs/latest/charts/line.html)

## Bugs
- Tooltip for temperaure graph is not working properly
- The dates are being converted to local timezone, this might be due to Date() object. Due to time constraint this bug was not solved. However, this should be the prority for the next version of the app. 

## Future Features
- Display the weather hours from the current time.
- Redesign the UI.



## Run the project

To get started with this project, clone the repository:

```bash
git clone https://github.com/yourusername/weather-app.git
cd weather-app