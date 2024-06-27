import axios from "axios";
import {
  getJwtToken,
  getRefreshToken,
  saveJwtToken,
  saveRefreshToken,
  removeRefreshToken,
  removeJwtToken,
} from "utils/cookie";
import { renewToken } from "api/userService";
import { API_URL, CURRENT_VERSION } from "./constants";

let refreshTokenRequest = null;

export const renewAccessToken = async (refreshToken) => {
  const { data } = await renewToken({ refreshToken });
  return data;
};

const axiosConfig = axios.create({
  baseURL: `${API_URL}/${CURRENT_VERSION}`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

axiosConfig.interceptors.request.use(async (config) => {
  const jwt = getJwtToken();
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }

  return config;
});

axiosConfig.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        refreshTokenRequest =
          refreshTokenRequest || renewAccessToken(refreshToken);
        try {
          const { accessToken: newToken, refreshToken: newRefreshToken } =
            await refreshTokenRequest;
          refreshTokenRequest = null;

          const { config } = error;
          config.headers.Authorization = `Bearer ${newToken}`;
          saveJwtToken(newToken);
          saveRefreshToken(newRefreshToken);

          return axiosConfig(config);
        } catch (err) {
          const { config } = error;
          removeJwtToken();
          removeRefreshToken();
          window.location.reload();
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosConfig;
