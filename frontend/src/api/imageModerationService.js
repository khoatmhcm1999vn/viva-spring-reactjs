import axios from "axios";

export const detectImages = async (data) => {
  return await axios.get(process.env.REACT_APP_DETECT_IMAGES_API_URL, {
    params: {
      url: data.url,
      models:
      'nudity, wad, gore',
      api_user: process.env.REACT_APP_DETECT_IMAGES_USER,
      api_secret: process.env.REACT_APP_DETECT_IMAGES_SECRET,
    },
  });
};