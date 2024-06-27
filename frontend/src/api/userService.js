import axiosConfig from "./axiosConfig";
import { API_ENDPOINT_KEYS } from "./constants";

export const login = async (data) => {
  return await axiosConfig.post(API_ENDPOINT_KEYS.LOGIN, data);
};

export const register = async (data) => {
  return await axiosConfig.post(API_ENDPOINT_KEYS.REGISTER, data);
};

export const verifyChangePassword = async (data) => {
  const res = await axiosConfig.post(API_ENDPOINT_KEYS.VERIFY, data, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
  return res;
};

export const activeNewAccount = async (data) => {
  const res = await axiosConfig.post(API_ENDPOINT_KEYS.ACTIVE_ACCOUNT, data, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
  return res;
};

export const resendToken = async (data) => {
  const res = await axiosConfig.post(API_ENDPOINT_KEYS.RESEND, data, {
    headers: {
      "Content-Type": "text/plain",
    },
  });

  return res;
};

export const forgotPassword = async (data) => {
  return await axiosConfig.post(API_ENDPOINT_KEYS.PASSWORD, data);
};

export const changePassword = async (data) => {
  return await axiosConfig.put(API_ENDPOINT_KEYS.PASSWORD, data);
};

export const getUserInformation = async (email = null, username = null) => {
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.CHECK}`, {
    params: { email, username },
  });
};

export const getCurrentUserInformation = async () => {
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.PROFILE}/info`, {});
};

export const uploadImage = async (data) => {
  return await axiosConfig.post(`${API_ENDPOINT_KEYS.ATTACTMENT}`, data);
};

export const changeProfileAvatar = async (data) => {
  return await axiosConfig.post(`${API_ENDPOINT_KEYS.CHANGE_AVATAR}`, data);
};

export const getProfile = async (username, data) => {
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.PROFILE}/${username}`, {
    params: data,
  });
};

export const getFollowingUsersById = async (data) => {
  const { _sort, limit, _order } = data;
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.FOLLOWING}/${data.account}`,
    {
      params: {
        _sort,
        _order,
        limit,
        page: data.page,
      },
    }
  );
};

export const getFollowersById = async (data) => {
  const { _sort, limit, _order } = data;
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.FOLLOWER}/${data.account}`,
    {
      params: {
        _sort,
        _order,
        limit,
        page: data.page,
      },
    }
  );
};

export const unfollowUserById = async (account) => {
  return await axiosConfig.delete(`${API_ENDPOINT_KEYS.FOLLOWING}/${account}`);
};

export const followUserById = async (account) => {
  return await axiosConfig.post(`${API_ENDPOINT_KEYS.FOLLOWING}/${account}`);
};

export const renewToken = async (data) => {
  return await axiosConfig.post(API_ENDPOINT_KEYS.RENEW_TOKEN, data);
};

export const searchAccountsByKeyword = async (data) => {
  const { _sort, limit, _order, keyword } = data;
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.ACCOUNT}/search`, {
    params: {
      _sort,
      _order,
      limit,
      keyword,
      page: data.page,
    },
  });
};

export const getSuggestedListOnNewsFeed = async () => {
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.ACCOUNT}/recommend`, {});
};

export const getSuggestedListOnProfile = async (id) => {
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.ACCOUNT}/recommend/profile/${id}`,
    {}
  );
};

export const editProfile = async (data) => {
  return await axiosConfig.put(`${API_ENDPOINT_KEYS.PROFILE}/edit`, data);
};
