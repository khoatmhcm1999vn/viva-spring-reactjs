import axiosConfig from "./axiosConfig";
import { API_ENDPOINT_KEYS } from "./constants";

export const getTopHashtagList = async (data) => {
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.HASHTAG}/top`, {
    params: {
      ...data,
    },
  });
};

export const getHashtagPostList = async (data) => {
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.HASHTAG}`, {
    params: {
      ...data,
    },
  });
};
