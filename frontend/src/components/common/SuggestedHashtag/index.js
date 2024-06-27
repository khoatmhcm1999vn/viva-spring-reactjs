import { Typography } from "@mui/material";
import { getTopHashtagList } from "api/hashtagService";
import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import "./style.scss";

const SuggestedHashtag = () => {
  const [hashtagList, setHashtagList] = useState([]);

  const history = useHistory();
  const handleGetHashtagList = () => {
    getTopHashtagList({
      limit: 10,
      page: 0,
    })
      .then((res) => {
        if (res.status === 200) {
          setHashtagList(res.data.content);
        }
      })
      .then((err) => {
        throw err;
      });
  };

  useEffect(() => {
    handleGetHashtagList();
  }, []);
  return (
    <Typography component="div" className="suggested-hashtag">
      <Typography className="title">Trends for you</Typography>
      <Typography className="hashtag-list">
        {hashtagList.length > 0 ? (
          hashtagList.map((item) => {
            return (
              <Typography
                className="hashtag-item"
                onClick={() => history.push(`/hashtag/${item.name.split('#')[1]}`)}
              >
                <Typography className="hashtag-title">{item.name}</Typography>
                <Typography className="hashtag-share">
                  {item.count} share
                </Typography>
              </Typography>
            );
          })
        ) : (
          <>No available trend now.</>
        )}
      </Typography>
    </Typography>
  );
};

export default SuggestedHashtag;
