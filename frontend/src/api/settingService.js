import axiosConfig from "./axiosConfig";
import { API_ENDPOINT_KEYS } from "./constants";

export const getAllSetting = async () => {
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.SETTING}`, {});
};

export const changeSetting = async (data) => {
  const { settingType, value } = data;
  return await axiosConfig.post(`${API_ENDPOINT_KEYS.SETTING}`, {
    settingType,
    value,
  });
};
