# Netatmo Super Ingester

Pulls in data from the Netatmo API. Crucially it does this using a combination of both getPublicData and getMeasure requests, and is careful not to breach the tight Netatmo API limits too often.

Although there can be a bit of delay between when Netatmo gets new data and this app pulling them in, the benefit is that this approach is more reliable at getting observations than just using getPublicData requests alone. 


## Netatmo Specs

Some useful specifications for the Netatmo sensors are available [here](https://www.netatmo.com/en-gb/weather/weatherstation/specifications).