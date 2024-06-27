import axiosConfig from "./axiosConfig";
import { API_ENDPOINT_KEYS } from "./constants";

export const getStatisticData = async () => {
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.STATISTIC}/getStatisticData`,
    {}
  );
};

export const getTheTopAccountMostFollowerStatistic = async (data) => {
  const { limit } = data;
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.STATISTIC}/user/most/followers`,
    {
      params: {
        limit,
      },
    }
  );
};

export const getPostQuantityStatisticInMonths = async () => {
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.STATISTIC}/post/in/months`,
    {}
  );
};

export const getPostQuantityStatisticInQuarters = async () => {
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.STATISTIC}/post/in/quarters`,
    {}
  );
};

export const getPostQuantityStatisticInYears = async () => {
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.STATISTIC}/post/in/years`,
    {}
  );
};

export const getTheTopPostInteraction = async (data) => {
  const { limit } = data;
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.STATISTIC}/post/top/interaction`,
    {
      params: {
        limit,
      },
    }
  );
};

export const getPostByNewestCreatedAt = async (data) => {
  const { limit } = data;
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.STATISTIC}/post/top/newest`,
    {
      params: {
        limit,
      },
    }
  );
};

export const getUserQuantityStatisticInMonths = async () => {
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.STATISTIC}/user/in/months`,
    {}
  );
};

export const getUserQuantityStatisticInQuarters = async () => {
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.STATISTIC}/user/in/quarters`,
    {}
  );
};

export const getUserQuantityStatisticInYears = async () => {
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.STATISTIC}/user/in/years`,
    {}
  );
};

export const getTopHashTagQuantityInTime = async (data) => {
  const { timeSection, limit } = data;

  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.STATISTIC}/hashtag/in/time`,
    {
      params: {
        timeSection,
        limit,
      },
    }
  );
};
