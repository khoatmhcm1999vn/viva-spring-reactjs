import axios from "axios";
import axiosConfig from "./axiosConfig";
import { API_ENDPOINT_KEYS } from "./constants";
const google = window.google;

export const getLatLng = async (callback) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(callback);
  }
};

export const getLocationInformation = async ({ latitude, longitude }) => {
  return await axios.get(`http://api.geonames.org/countryCodeJSON`, {
    params: {
      lat: `${latitude}`,
      lng: `${longitude}`,
      username: "nguyentruc",
    },
  });
};

export const getPositionOfCurrentUser = async () => {
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.SETTING}/location`, {});
};

export const getLatestLoginLocationOfAllUser = async () => {
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.STATISTIC}/user/location`,
    {}
  );
};

export const deleteUserLocationItem = async (id) => {
  return await axiosConfig.delete(
    `${API_ENDPOINT_KEYS.SETTING}/location/${id}`,
    {}
  );
};
