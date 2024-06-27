import axiosConfig from "./axiosConfig";
import { API_ENDPOINT_KEYS } from "./constants";

export const createPostReport = async (data) => {
  return await axiosConfig.post(API_ENDPOINT_KEYS.POST_REPORT, data);
};

export const getDetailPostReport = async (id) => {
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.POST_REPORT}/${id}`);
};

export const getListPostReport = async (data) => {
  const { _sort, limit, _order, page, isActive } = data;
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.POST_REPORT}`, {
    params: {
      _sort,
      _order,
      limit,
      page,
      isActive
    },
  });
};

export const approvedPostReport = async (id) => {
  return await axiosConfig.delete(
    `${API_ENDPOINT_KEYS.POST_REPORT}/approved/${id}`
  );
};

export const rejectedPostReport = async (id) => {
  return await axiosConfig.delete(
    `${API_ENDPOINT_KEYS.POST_REPORT}/rejected/${id}`
  );
};

export const createCommentReport = async (data) => {
  return await axiosConfig.post(API_ENDPOINT_KEYS.COMMENT_REPORT, data);
};

export const getListCommentReport = async (data) => {
  const { _sort, limit, _order, page, isActive } = data;
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.COMMENT_REPORT}`, {
    params: {
      _sort,
      _order,
      limit,
      page,
      isActive
    },
  });
};

export const approvedCommentReport = async (id) => {
  return await axiosConfig.delete(
    `${API_ENDPOINT_KEYS.COMMENT_REPORT}/approved/${id}`
  );
};

export const rejectedCommentReport = async (id) => {
  return await axiosConfig.delete(
    `${API_ENDPOINT_KEYS.COMMENT_REPORT}/rejected/${id}`
  );
};

export const getDetailCommentReport = async (id) => {
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.COMMENT_REPORT}/${id}`);
};

export const createAccountReport = async (data) => {
  return await axiosConfig.post(API_ENDPOINT_KEYS.ACCOUNT_REPORT, data);
};

export const getListAccountReport = async (data) => {
  const { _sort, limit, _order, page, isActive } = data;
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.ACCOUNT_REPORT}`, {
    params: {
      _sort,
      _order,
      limit,
      page,
      isActive
    },
  });
};

export const approvedAccountReport = async (id) => {
  return await axiosConfig.delete(
    `${API_ENDPOINT_KEYS.ACCOUNT_REPORT}/approved/${id}`
  );
};

export const rejectedAccountReport = async (id) => {
  return await axiosConfig.delete(
    `${API_ENDPOINT_KEYS.ACCOUNT_REPORT}/rejected/${id}`
  );
};
