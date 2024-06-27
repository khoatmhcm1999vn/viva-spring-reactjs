import { Typography, Button } from "@mui/material";
import { getProfile } from "api/userService";
import { useState, useEffect, useRef, useContext } from "react";
import { useHistory } from "react-router-dom";
import { getCurrentUser } from "utils/jwtToken";
import { substringUsername } from "utils/resolveData";
import CustomPopUp from "../CustomPopUp";
import FollowButton from "../FollowButton";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import { AuthUser } from "../../../App";
import "./style.scss";
import { useTranslation } from "react-i18next";
import OutlineProfile from "../OulineProfile";
import UsernameContainer from "../UsernameContainer";

const FollowUserItem = (props) => {
  const { handleCloseModal, user } = props;
  const [showPopUp, setShowPopUp] = useState(false);
  const [isFollowing, setFollowing] = useState(
    user.isFollowing || user.following
  );
  const [userInfo, setUserInfo] = useState({});
  const [localLoading, setLocalLoading] = useState(true);
  const [isUpdated, setIsUpdated] = useState(false);
  const positionRef = useRef();

  const Auth = useContext(AuthUser);

  const history = useHistory();
  const navigateToUser = (username) => {
    handleCloseModal(false);
    history.push(`/profile/${username}`);
  };
  const handleOpenPopUp = () => {
    if (!userInfo.id) {
      handleGetProfile(user.username);
    }
    setShowPopUp(true);
  };

  const handleClosePopUp = () => {
    setShowPopUp(false);
    if (isUpdated) {
      handleUpdateMiniProfile();
    }
  };

  const handleGetProfile = (username) => {
    setLocalLoading(true);
    getProfile(username, { limit: 3 })
      .then((res) => {
        if (res.status === 200) {
          setUserInfo(res.data);
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setLocalLoading(false);
      });
  };

  const handleUpdateMiniProfile = () => {
    handleGetProfile(user.username);
  };

  return (
    <Typography component="div" className="follow-item-container">
      <Typography component="div" className="follow-item">
        <Typography component="div" className="follow-avatar">
          <Typography component="div" className="avatar-container">
            <img src={user.avatar} width={35} height={35} />
          </Typography>
        </Typography>
        <Typography component="div" className="follow-name">
          {/* <Typography
            className="username-container"
            component="div"
            onMouseEnter={handleOpenPopUp}
            onMouseLeave={handleClosePopUp}
          >
            <Typography
              className="username"
              onClick={() => navigateToUser(user.username)}
              ref={positionRef}
            >
              {substringUsername(user.username)}
            </Typography>

            {showPopUp && (
              <CustomPopUp
                width={390}
                height={350}
                positionRef={positionRef.current?.getBoundingClientRect()}
                hightZIndex={true}
              >
                <OutlineProfile
                  userInfo={userInfo}
                  isFollowing={isFollowing}
                  setFollowing={setFollowing}
                  localLoading={localLoading}
                  setIsUpdated={setIsUpdated}
                />
              </CustomPopUp>
            )}
          </Typography> */}
          <UsernameContainer
            username={user.username}
            isOnModal={true}
            isFollowing={isFollowing}
            setFollowing={setFollowing}
            isUpdated={isUpdated}
            setIsUpdated={setIsUpdated}
          />
          <Typography className="fullName">{user.fullName}</Typography>
        </Typography>
        {getCurrentUser().accountId !== user.id && !Auth.auth.isAdmin && (
          <FollowButton
            userProfile={user}
            isFollowing={isFollowing}
            setFollowing={setFollowing}
          />
        )}
      </Typography>
    </Typography>
  );
};

export default FollowUserItem;
