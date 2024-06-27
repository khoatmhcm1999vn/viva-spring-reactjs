import axiosConfig from "./axiosConfig";
import { API_ENDPOINT_KEYS } from "./constants";

export const getConversations = async (data) => {
  const { limit, page } = data;
  return axiosConfig.get(API_ENDPOINT_KEYS.CONVERSATION, {
    params: {
      limit,
      page,
    },
  });
};

export const getConversationByUsername = async (data) => {
  const { _sort, limit, _order, username: keyword } = data;
  return axiosConfig.get(`${API_ENDPOINT_KEYS.CONVERSATION}/search`, {
    params: {
      _sort,
      _order,
      limit,
      page: data.page,
      keyword,
    },
  });
};

export const getMessagesByConversationId = async (data) => {
  const { _sort, limit, _order, username: keyword, id } = data;
  return axiosConfig.get(`${API_ENDPOINT_KEYS.CONVERSATION}/${id}/message`, {
    params: {
      _sort,
      _order,
      limit,
      page: data.page,
      keyword,
    },
  });
};

export const getListOfConversationId = async () => {
  return axiosConfig.get(`${API_ENDPOINT_KEYS.CONVERSATION}/id`, {});
};

export const checkConversationIsExistOrNot = async (id) => {
  return axiosConfig.get(`${API_ENDPOINT_KEYS.CONVERSATION}/check/${id}`, {});
}
