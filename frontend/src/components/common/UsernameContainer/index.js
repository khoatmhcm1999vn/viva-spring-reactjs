import * as React from "react";
import { Typography } from "@mui/material";
import "./style.scss";
import { useHistory } from "react-router-dom";
import OutlineProfile from "../OulineProfile";
import { getProfile } from "api/userService";
import CustomPopUp from "../CustomPopUp";
import { substringUsername } from "utils/resolveData";
import classNames from "classnames";

const UsernameContainer = ({
  username,
  isOnModal = false,
  isFollowing: isFollowingOnProps,
  setFollowing: setFollowingOnProps,
  setIsUpdated: setIsUpdatedOnProps,
  isUpdatedOnProps: isUpdatedOnProps,
}) => {
  const [showPopUp, setShowPopUp] = React.useState(false);
  const [localLoading, setLocalLoading] = React.useState(false);
  const [isUpdated, setIsUpdated] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState({});
  const [isFollowing, setFollowing] = React.useState(false);

  const history = useHistory();
  const positionRef = React.useRef();

  const handleOpenPopUp = () => {
    if (!userInfo.id) {
      handleGetProfile(username);
    }
    setShowPopUp(true);
  };

  const handleClosePopUp = () => {
    setShowPopUp(false);
    if (isUpdated) {
      handleGetProfile(username);
    }
    if (isUpdatedOnProps) {
      handleGetProfile(username);
    }
  };

  const handleGetProfile = (username) => {
    setLocalLoading(true);
    getProfile(username, { limit: 3 })
      .then((res) => {
        if (res.status === 200) {
          setUserInfo(res.data);
          if (setFollowingOnProps) {
            setFollowingOnProps(res.data.following);
          } else {
            setFollowing(res.data.following);
          }
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setLocalLoading(false);
      });
  };

  React.useEffect(() => {
    setUserInfo({ ...userInfo, following: isFollowing });
  }, [isFollowing]);

  React.useEffect(() => {
    setUserInfo({ ...userInfo, following: isFollowingOnProps });
  }, [isFollowingOnProps]);

  const classNameByType = classNames({
    "username-container-on-page": !isOnModal,
    "username-container-on-modal": isOnModal,
  });

  return (
    <Typography
      className={classNameByType}
      component="div"
      onMouseEnter={handleOpenPopUp}
      onMouseLeave={handleClosePopUp}
    >
      <Typography
        className="username-content"
        onClick={() => history.push(`/profile/${username}`)}
        ref={positionRef}
      >
        {substringUsername(username)}
      </Typography>
      {showPopUp && (
        <CustomPopUp
          width={390}
          height={350}
          positionRef={
            isOnModal
              ? positionRef.current?.getBoundingClientRect()
              : { left: 0, bottom: 0, top: 0, right: 0 }
          }
          hightZIndex={isOnModal}
        >
          <OutlineProfile
            userInfo={userInfo}
            isFollowing={
              isFollowingOnProps ? isFollowingOnProps : userInfo.following
            }
            setFollowing={
              setFollowingOnProps ? setFollowingOnProps : setFollowing
            }
            localLoading={localLoading}
            setIsUpdated={
              setIsUpdatedOnProps ? setIsUpdatedOnProps : setIsUpdated
            }
          />
        </CustomPopUp>
      )}
    </Typography>
  );
};

export default UsernameContainer;
