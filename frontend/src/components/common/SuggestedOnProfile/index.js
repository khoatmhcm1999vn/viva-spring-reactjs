import { useState, useEffect } from "react";
import { Typography } from "@mui/material";
import Carousel from "react-elastic-carousel";
import FollowButton from "../FollowButton";
import "./style.scss";
import { useHistory } from "react-router-dom";

const SuggestedOnProfile = ({ suggestedUsers, setSuggestedUsers }) => {
  const breakPoints = [
    { width: 1, itemsToShow: 1 },
    { width: 520, itemsToShow: 3, itemsToScroll: 2 },
  ];
  const history = useHistory();
  return (
    <Typography component="div" className="suggested-on-profile">
      <Typography className="title">Suggested</Typography>
      <Carousel breakPoints={breakPoints}>
        {suggestedUsers.map((user, index) => {
          return (
            <Typography component="div" className="suggested-item">
              <img
                key={index}
                src={user.avatar}
                width="60px"
                height="60px"
                className="avatar"
                alt=""
              />
              <Typography component="div" className="item-name">
                <Typography
                  className="username"
                  onClick={() => history.push(`/profile/${user.username}`)}
                >
                  {user.username}
                </Typography>
                <Typography className="fullName">{user.fullName}</Typography>
              </Typography>
              <FollowButton
                userProfile={user}
                isFollowing={user.isFollowing}
                setFollowing={(res) => {
                  const currList = [...suggestedUsers];
                  currList[index].isFollowing = res;
                  setSuggestedUsers(currList);
                }}
              />
            </Typography>
          );
        })}
      </Carousel>
    </Typography>
  );
};

export default SuggestedOnProfile;
