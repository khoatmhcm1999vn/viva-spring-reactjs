import { useState, useEffect, useContext } from "react";
import { Typography } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import "./style.scss";
import { getLikeListByPostId, likePost, unlikePost } from "api/postService";
import _ from "lodash";
import CustomModal from "../CustomModal";
import FollowUserItem from "../FollowUserItem";
import { AuthUser } from "App";

import { useTranslation } from "react-i18next";
import ChattingSearch from "../ChattingSearch";
import useSnackbar from "hooks/useSnackbar";
import useSocket from "hooks/useSocket";
import { checkConversationIsExistOrNot } from "api/chatService";
import { useHistory } from "react-router-dom";
import { handleFilterHashtagOfCaption } from "utils/resolveData";

const Interaction = ({ currentPost, handleClick, index, dataList }) => {
  const { isLiked, id: postId } = currentPost;
  const [like, setLike] = useState(isLiked);
  const [id, setId] = useState(postId);
  const [likeCount, setLikeCount] = useState(currentPost.likeCount);
  const [pageNumber, setPageNumber] = useState(0);
  const [showLikeList, setShowLikeList] = useState(false);
  const [likeList, setLikeList] = useState([]);
  const [fetchInfo, setFetchInfo] = useState({});
  const { handlers, states, setStates } = useSocket();
  const { receivedMessage, newConversation, activeUsers, conversationList } =
    states;
  const {
    setReceivedMessage,
    setNewConversation,
    setActiveUsers,
    setConversationList,
  } = setStates;
  const {
    chatInExistedConversation,
    chatInVirtualConversation,
    typing,
    untyping,
  } = handlers;

  const [showChattingSearch, setShowChattingSearch] = useState(false);
  const { setSnackbarState } = useSnackbar();

  const { t: trans } = useTranslation();
  const history = useHistory();

  const Auth = useContext(AuthUser);

  useEffect(() => {
    setLike(isLiked);
  }, [currentPost]);

  useEffect(() => {
    setId(postId);
  }, [currentPost]);

  const handleLikePost = () => {
    likePost(id).then((res) => {
      if (res.status === 200) {
        setLike(true);
        setLikeCount(likeCount + 1);
      }
    });
  };

  const handleUnlikePost = () => {
    unlikePost(id).then((res) => {
      if (res.status === 200) {
        setLike(false);
        setLikeCount(likeCount - 1);
      }
    });
  };

  const handleGetLikeList = () => {
    getLikeListByPostId({
      postId,
      // _sort: "username",
      _order: "desc",
      limit: 15,
      page: pageNumber,
    })
      .then((res) => {
        if (res.status === 200) {
          if (!showLikeList) {
            setShowLikeList(true);
          }
          if (pageNumber > 0) {
            setLikeList([...likeList, ...res.data.content]);
            // likeList.push(res.data.content)
          } else {
            setLikeList([...res.data.content]);
          }
          setFetchInfo(res.data);
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {});
  };

  useEffect(() => {
    if (pageNumber > 0) {
      handleGetLikeList();
    }
  }, [pageNumber]);

  const handleCloseLikeListModal = () => {
    setShowLikeList(false);
    setLikeList([]);
    setPageNumber(0);
  };

  const handleOpenChattingSearchModal = () => {
    setShowChattingSearch(true);
  };

  const handleCloseChattingSearchModal = () => {
    setShowChattingSearch(false);
  };

  const handleSharePost = (selectedList) => {
    const { id } = currentPost;
    selectedList.map((selectedUser) => {
      checkConversationIsExistOrNot(selectedUser.id)
        .then((res) => {
          if (res.status === 200) {
            chatInExistedConversation(res.data.id, `[sharePost|${id}]`);
          }
        })
        .catch(() => {
          const tempList = [];
          const { username } = selectedUser;
          tempList.push(username);
          chatInVirtualConversation(tempList, `[sharePost|${id}]`);
        });
      setSnackbarState({
        open: true,
        content: "Shared successfully",
        type: "SUCCESS",
      });
    });
    setShowChattingSearch(false);
  };

  const handleClickHashtag = ({ target }) => {
    if (target.nodeName === "HASHTAG") {
      history.push(`/hashtag/${target.textContent.split("#")[1]}`);
    }
  };

  return (
    <>
      {!Auth.auth.isAdmin && (
        <Typography
          component="div"
          align="left"
          className="interaction-container"
        >
          {like ? (
            <FavoriteIcon className="like-icon" onClick={handleUnlikePost} />
          ) : (
            <FavoriteBorderIcon
              className="unlike-icon"
              onClick={handleLikePost}
            />
          )}
          <ChatBubbleOutlineOutlinedIcon
            className="comment-icon"
            onClick={() => handleClick(index, currentPost, dataList)}
          />
          <ShareOutlinedIcon
            className="share-icon"
            onClick={handleOpenChattingSearchModal}
          />
        </Typography>
      )}

      <Typography
        className="number-of-likes"
        align="left"
        onClick={handleGetLikeList}
      >
        {likeCount}{" "}
        {likeCount > 1 ? " " + trans("newFeed.like") : trans("newFeed.like")}
      </Typography>
      <Typography className="post-caption" align="left">
        <strong
          className="owner-name"
          onClick={() =>
            history.push(`/profile/${currentPost.createdBy?.username}`)
          }
        >
          {currentPost.createdBy?.username}
        </strong>{" "}
        <span
          onClick={handleClickHashtag}
          dangerouslySetInnerHTML={{
            __html: handleFilterHashtagOfCaption(currentPost.caption),
          }}
        />
      </Typography>

      <CustomModal
        isRadius
        open={showLikeList}
        title={_.startCase(_.toLower("LIKES"))}
        handleCloseModal={handleCloseLikeListModal}
        width={400}
        height={400}
      >
        <Typography component="div" className="follow-container">
          <Typography className="follow-list">
            {likeList.length > 0 &&
              likeList.map((user) => {
                return (
                  <FollowUserItem
                    user={user}
                    handleCloseModal={handleCloseLikeListModal}
                  />
                );
              })}
            {!fetchInfo.last && (
              <Typography
                className="view-more"
                onClick={() => setPageNumber(pageNumber + 1)}
              >
                View more
              </Typography>
            )}
          </Typography>
        </Typography>
      </CustomModal>

      <CustomModal
        isRadius
        width={400}
        height={400}
        open={showChattingSearch}
        handleCloseModal={handleCloseChattingSearchModal}
      >
        <ChattingSearch handleNext={handleSharePost} isShare={true} />
      </CustomModal>
    </>
  );
};

export default Interaction;
