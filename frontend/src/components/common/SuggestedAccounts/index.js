import { useState, useEffect } from "react";
import { Typography } from "@mui/material";
import { getCurrentUser } from "utils/jwtToken";
import { getProfile, getSuggestedListOnNewsFeed } from "api/userService";
import ReactLoading from "react-loading";
import FollowButton from "../FollowButton";
import { useHistory } from "react-router-dom";
import "./style.scss";
import UsernameContainer from "../UsernameContainer";

const SuggestedAccounts = () => {
  const [isLoading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [suggestList, setSuggestList] = useState([]);

  const history = useHistory();

  const handleGetProfile = (username) => {
    setLoading(true);
    getProfile(username, { limit: 1 })
      .then((res) => {
        if (res.status === 200) {
          setUserInfo(res.data);
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleGetSuggestedList = () => {
    getSuggestedListOnNewsFeed()
      .then((res) => {
        if (res.status === 200) {
          setSuggestList(
            res.data
              .filter((user) => user.username !== getCurrentUser().username)
              .slice(0, 6)
          );
        }
      })
      .catch((err) => {
        throw err;
      });
  };
  useEffect(() => {
    handleGetProfile(getCurrentUser().username);
    handleGetSuggestedList();
  }, []);

  return (
    <Typography component="div" className="suggested-accounts-container">
      {userInfo && (
        <Typography component="div" className="suggested-accounts">
          <Typography className="mini-profile">
            <Typography component="div" className="background">
              <img
                width="100%"
                src={require("images/profile-background.jpg")}
              />
            </Typography>
            <Typography component="div" className="avatar">
              <img with="100" height="100" src={userInfo.avatar} />
            </Typography>
            <Typography
              className="username"
              onClick={() => history.push(`/profile/${userInfo.username}`)}
            >
              {userInfo.username}
            </Typography>
            <Typography className="fullname">{userInfo.fullName}</Typography>
          </Typography>

          <Typography component="div" className="information">
            <Typography component="div" className="posts">
              <strong>{userInfo.postCount}</strong> POSTS
            </Typography>
            <Typography component="div" className="following">
              <strong>{userInfo.followingCount}</strong> FOLLOWING
            </Typography>
            <Typography component="div" className="followers">
              <strong>{userInfo.followerCount}</strong> FOLLOWERS
            </Typography>
          </Typography>
          <Typography component="div" className="rest"></Typography>
        </Typography>
      )}

      <Typography className="suggested-account-list">
        <Typography className="title">Suggestions for you</Typography>
        <Typography className="suggest-list">
          {suggestList.length > 0 ? (
            suggestList.map((user, index) => {
              return (
                <Typography className="suggest-item">
                  <img src={user.avatar} width="30px" height="30px" />
                  <Typography className="right-content">
                    <UsernameContainer
                      username={user.username}
                      isFollowing={user.isFollowing}
                      setFollowing={(res) => {
                        const currList = [...suggestList];
                        currList[index].isFollowing = res;
                        setSuggestList(currList);
                      }}
                    />
                    <Typography className="details">
                      {user.mutualFriends?.length > 0
                        ? `Both follow ${user.mutualFriends[0].username} ${
                            user.mutualFriends.length > 1
                              ? `+ ${user.mutualFriends.length - 1} more`
                              : ""
                          }`
                        : "Popular"}
                    </Typography>
                  </Typography>
                  <FollowButton
                    userProfile={user}
                    isFollowing={user.isFollowing}
                    setFollowing={(res) => {
                      const currList = [...suggestList];
                      currList[index].isFollowing = res;
                      setSuggestList(currList);
                    }}
                  />
                </Typography>
              );
            })
          ) : (
            <p>No suggested user</p>
          )}
        </Typography>
      </Typography>
    </Typography>
  );
};

export default SuggestedAccounts;
