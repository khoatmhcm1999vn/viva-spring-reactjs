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

export const OutlineProfile = ({
  userInfo,
  isFollowing,
  setFollowing,
  localLoading,
  setIsUpdated,
}) => {
  const { t: trans } = useTranslation();
  const [followerCount, setFollowerCount] = useState(userInfo.followerCount);
  const [initialFollowerState, setInitialFollowerState] = useState(isFollowing);

  const Auth = useContext(AuthUser);

  useEffect(() => {
    setFollowerCount(userInfo.followerCount);
    setInitialFollowerState(isFollowing);
  }, [userInfo]);

  useEffect(() => {
    if (initialFollowerState !== isFollowing) {
      if (isFollowing) {
        setFollowerCount(followerCount + 1);
      } else {
        setFollowerCount(followerCount - 1);
      }
      setIsUpdated(true);
    } else {
      setFollowerCount(userInfo.followerCount);
      setIsUpdated(false);
    }
  }, [isFollowing]);

  return (
    !localLoading && (
      <Typography component="div" className="user-info-popup">
        <Typography component="div" className="popup-line1">
          <img src={userInfo.avatar} width={60} height={60} />
          <Typography className="user-info-details">
            <Typography className="user-info-username">
              {userInfo.username}
            </Typography>
            <Typography className="user-info-fullname">
              {userInfo.fullName}
            </Typography>
          </Typography>
        </Typography>
        <Typography component="div" className="popup-line2">
          <Typography
            component="div"
            align="center"
            className="number-of-container"
          >
            <p className="number">
              <strong>{userInfo.postCount || 0} </strong>
              <div className="label">{trans("profile.posts")}</div>
            </p>
          </Typography>
          <Typography
            component="div"
            align="center"
            className="number-of-container"
          >
            <p className="number">
              <strong>{followerCount || 0} </strong>
              <div className="label">{trans("profile.followers")}</div>
            </p>
          </Typography>
          <Typography
            component="div"
            align="center"
            className="number-of-container"
          >
            <p className="number">
              <strong>{userInfo.followingCount || 0} </strong>
              <div className="label">{trans("profile.following")}</div>
            </p>
          </Typography>
        </Typography>
        <Typography component="div" className="popup-line3">
          {userInfo.pagePost?.content.length > 0 ? (
            userInfo.pagePost?.content.map((item) => {
              return <img src={item.firstImage} width={130} height={130} />;
            })
          ) : (
            <Typography component="div" align="center" className="no-data">
              <CameraAltOutlinedIcon className="no-data-icon" />
              <Typography className="no-data-label">
                {trans("profile.haveNoPost")}
              </Typography>
            </Typography>
          )}
        </Typography>

        <Typography component="div" className="popup-line4">
          {getCurrentUser().accountId !== userInfo.id && !Auth.auth.isAdmin && (
            <>
              <Button className="message-btn">
                {trans("profile.message")}
              </Button>
              <FollowButton
                userProfile={userInfo}
                isFollowing={isFollowing}
                setFollowing={setFollowing}
                inPopUp={true}
              />
            </>
          )}
        </Typography>
      </Typography>
    )
  );
};

export default OutlineProfile;
