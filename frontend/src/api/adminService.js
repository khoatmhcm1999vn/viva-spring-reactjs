import axiosConfig from "./axiosConfig";
import { API_ENDPOINT_KEYS } from "./constants";

export const getAllAdmins = async (data) => {
  const { _sort, limit, _order, page } = data;
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.ADMIN}`, {
    params: {
      _sort,
      _order,
      limit,
      page,
    },
  });
};

export const createNewAdmin = async (data) => {
  const { email, fullName, password, username } = data;
  return await axiosConfig.post(`${API_ENDPOINT_KEYS.ADMIN}`, {
    email,
    fullName,
    password,
    username,
  });
};

export const deleteAdmin = async (id) => {
  return await axiosConfig.delete(`${API_ENDPOINT_KEYS.ADMIN}/${id}`, {});
};

export const getPostOnAnyStatus = async ({ id }) => {
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.ADMIN}/post/${id}`, {});
};

export const getResolvedReportAdminInfo = async (id) => {
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.ADMIN}/profile/${id}`, {});
};
