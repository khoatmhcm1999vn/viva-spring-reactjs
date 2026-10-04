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

/**
 * Cho duy nhat ghi log request that bai.
 *
 * Nho co day, call site khong can log lai, chi can khong de rejection lan ra thanh
 * unhandled rejection (xem utils/apiError.js). Mot dong log gon cho moi loi, kem
 * day du thong tin de truy: method, duong dan, ma trang thai va body phan hoi.
 */
const logFailedRequest = (error) => {
  const config = error?.config || {};
  const method = (config.method || "get").toUpperCase();
  const url = `${config.baseURL || ""}${config.url || ""}`;
  const status = error?.response?.status;

  if (status) {
    console.error(`[API] ${method} ${url} -> ${status}`, error.response.data);
  } else {
    // Khong co response: thuong la backend chua chay, sai port, hoac bi CORS chan.
    console.error(`[API] ${method} ${url} -> khong co phan hoi`, error.message);
  }
};

axiosConfig.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
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
          removeJwtToken();
          removeRefreshToken();
          window.location.reload();
        }
      }
    }

    logFailedRequest(error);

    // Van reject de call site nao CAN xu ly rieng thi lam duoc, vi du LoginPage doc
    // cac ma 1001 / 1002 / 1003 tu body. Cac call site khong can xu ly thi dung
    // ignoreApiError de chan rejection lai.
    return Promise.reject(error);
  }
);

export default axiosConfig;
