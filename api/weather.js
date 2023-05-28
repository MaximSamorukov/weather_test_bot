const axios = require("axios");

const endpoint =
  "https://api.open-meteo.com/v1/forecast?latitude=:lat&longitude=:long&current_weather=true";
const moscow = {
  lat: "55.76143",
  long: "37.62078",
};

const petersburg = {
  lat: "59.936888",
  long: "30.354705",
};

const cities = {
  moscow,
  petersburg,
};

const geoEndpoint = "https://geocoding-api.open-meteo.com/v1/search";

const getWeatherData = async (city) => {
  const url = endpoint
    .replace(":lat", cities[city].lat)
    .replace(":long", cities[city].long);
  try {
    const result = await axios.get(url);
    return result.data;
  } catch (er) {
    throw new Error("Error on getting weather data");
  }
};

const getCityDataByName = async (name) => {
  const url = geoEndpoint;
  try {
    const result = await axios.get(url, { params: { name } });
    return result.data;
  } catch (er) {
    throw new Error("Error on getting geo data");
  }
};

const getWeatherDataByCoordinates = async ({ lat, long }) => {
  const url = endpoint.replace(":lat", lat).replace(":long", long);
  try {
    const result = await axios.get(url);
    return result.data;
  } catch (er) {
    throw new Error("Error on getting weather data");
  }
};
module.exports = {
  getWeatherData,
  getCityDataByName,
  getWeatherDataByCoordinates,
};
