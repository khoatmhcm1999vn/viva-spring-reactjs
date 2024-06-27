import { useState, useEffect } from "react";
import ReactLoading from "react-loading";
import classNames from "classnames";
import { Typography, Button } from "@mui/material";
import {
  followUserById,
  getFollowersById,
  getFollowingUsersById,
  getProfile,
  unfollowUserById,
} from "api/userService";
import useSnackbar from "hooks/useSnackbar";
import CheckIcon from "@mui/icons-material/Check";
import CustomModal from "components/common/CustomModal";
import "./style.scss";
import useUpdateProfile from "hooks/useUpdateProfile";
import { useTranslation } from "react-i18next";

const FollowButton = (props) => {
  const {
    userProfile,
    following,
    isFollowing,
    setFollowing,
    inPopUp = false,
  } = props;
  const [isLocalLoading, setLocalLoading] = useState(false);
  const [unfollowModal, setUnfollowModal] = useState({
    open: false,
    data: {},
  });
  // const [isFollowing, setFollowing] = useState(follow);

  // useEffect(() => {
  //   setFollowing(follow);
  // }, [follow]);

  const { t: trans } = useTranslation();

  const changeFormatByCondition = (condition) => {
    const followedButtonColor = classNames("followed-btn", {
      unfollowed: !condition,
      followed: condition,
    });
    return followedButtonColor;
  };

  const handleOpenUnfollowModal = (userInfo) => {
    setUnfollowModal({
      open: true,
      data: userInfo,
    });
  };

  const handleFollowUser = (id) => {
    setLocalLoading(true);
    followUserById(id)
      .then((res) => {
        if (res.status === 200) {
          setFollowing(true);
          // setUpdatedItem({ id, following: true, inPopUp });
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setLocalLoading(false);
      });
  };

  const handleCloseUnfollowModal = () => {
    setUnfollowModal({ ...unfollowModal, open: false });
  };

  const handleUnfollowUser = (id) => {
    handleCloseUnfollowModal();
    setLocalLoading(true);
    unfollowUserById(id)
      .then((res) => {
        if (res.status === 200) {
          setFollowing(false);
          // setUpdatedItem({ id, following: false, inPopUp });
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setLocalLoading(false);
      });
  };

  const RenderUnfollowModal = () => {
    const userInfo = unfollowModal.data;

    const { t: trans } = useTranslation();

    return (
      <Typography component="div" className="unfollow-container">
        <Typography component="div" className="unfollow-user-info">
          <img src={userInfo.avatar} width={100} height={100} />
          <Typography className="confirm-question">
            {trans("profile.unfollow")} @{userInfo.username}?
          </Typography>
        </Typography>
        <Typography component="div" className="action-btns">
          <Button
            className="unfollow-btn"
            onClick={() => handleUnfollowUser(userInfo.id, userInfo.username)}
          >
            {trans("profile.unfollow")}
          </Button>
          <Button className="cancel-btn" onClick={handleCloseUnfollowModal}>
            {trans("profile.cancel")}
          </Button>
        </Typography>
      </Typography>
    );
  };

  return (
    <Typography component="div" className="followed-btn-container">
      <Button
        className={`${changeFormatByCondition(isFollowing)}`}
        onClick={() =>
          isFollowing
            ? handleOpenUnfollowModal(userProfile)
            : handleFollowUser(userProfile.id, userProfile.username, -1)
        }
      >
        {isLocalLoading ? (
          <ReactLoading type="spokes" color="#00000" height={18} width={18} />
        ) : isFollowing ? (
          <CheckIcon />
        ) : (
          trans("profile.follow")
        )}
      </Button>
      <CustomModal
        isRadius
        width={400}
        height={300}
        open={unfollowModal.open}
        handleCloseModal={handleCloseUnfollowModal}
      >
        {RenderUnfollowModal()}
      </CustomModal>
    </Typography>
  );
};

export default FollowButton;
