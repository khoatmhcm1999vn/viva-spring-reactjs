import axiosConfig from "./axiosConfig";
import { API_ENDPOINT_KEYS } from "./constants";

export const uploadImages = async (data) => {
  return await axiosConfig.post(API_ENDPOINT_KEYS.UPLOAD_IMAGE, data);
};

export const createPost = async (data) => {
  return await axiosConfig.post(API_ENDPOINT_KEYS.POST, data);
};

export const getPostsByUserName = async (data) => {
  const { _sort, limit, _order } = data;
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.PROFILE}/${data.username}/outline-post`,
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

export const getPostDetail = async (data) => {
  const { _sort, limit, _order } = data;
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.POST}/${data.id}`, {
    params: {
      _sort,
      _order,
      limit,
    },
  });
};

export const likePost = async (id) => {
  return await axiosConfig.post(`${API_ENDPOINT_KEYS.LIKE}/${id}`);
};

export const unlikePost = async (id) => {
  return await axiosConfig.delete(`${API_ENDPOINT_KEYS.LIKE}/${id}`);
};

export const getFirstLevelCommentListByPostId = async (data) => {
  const { _sort, limit, _order, page } = data;
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.POST}/${data.id}/first-level-comment`,
    {
      params: {
        _sort,
        _order,
        limit,
        page,
      },
    }
  );
};

export const getChildCommentListByPostId = async (data) => {
  const { _sort, limit, _order, page } = data;
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.POST}/${data.postId}/comment/${data.parentCommentId}/child-comment`,
    {
      params: {
        _sort,
        _order,
        limit,
        page,
      },
    }
  );
};

export const comment = async (data) => {
  return await axiosConfig.post(`${API_ENDPOINT_KEYS.COMMENT}`, data);
};

export const deleteComment = async (id) => {
  return await axiosConfig.delete(`${API_ENDPOINT_KEYS.COMMENT}/${id}`);
};

export const getLikeListByPostId = async (data) => {
  const { _sort, limit, _order, page } = data;
  return await axiosConfig.get(
    `${API_ENDPOINT_KEYS.LIKE}/post/${data.postId}`,
    {
      params: {
        _sort,
        _order,
        limit,
        page,
      },
    }
  );
};

export const getNewFeed = async (data) => {
  const { limit, page } = data;
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.NEWFEED}`, {
    params: {
      limit,
      page,
    },
  });
};

export const getTrending = async (data) => {
  const { limit, page } = data;
  return await axiosConfig.get(`${API_ENDPOINT_KEYS.TRENDING}`, {
    params: {
      limit,
      pageIndex: page,
    },
  });
};
