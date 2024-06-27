import axiosConfig from "./axiosConfig";
import { API_ENDPOINT_KEYS } from "./constants";

export const getNotificationList = async (data) => {
  const { limit, page, _sort, _order, status } = data;
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.NOTIFICATION}`, {
    params: {
      limit,
      page,
      _sort,
      _order,
      status,
    },
  });
};

export const updateNotificationItem = async (data) => {
  const { id, status } = data;
  return await axiosConfig.put(
    `${API_ENDPOINT_KEYS.NOTIFICATION}/${id}`,
    status
  );
};

export const changeStatusOfAllNotificationFromSentToReceived = async () => {
  return await axiosConfig.put(
    `${API_ENDPOINT_KEYS.NOTIFICATION}/status/from/sent/to/received`,
    {}
  );
};
