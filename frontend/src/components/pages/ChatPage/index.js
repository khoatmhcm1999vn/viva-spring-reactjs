import {
  InputBase,
  Typography,
  Badge,
  Button,
  ClickAwayListener,
  Tooltip,
} from "@mui/material";
import { useState, useEffect } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import SearchIcon from "@mui/icons-material/Search";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import SentimentSatisfiedAltOutlinedIcon from "@mui/icons-material/SentimentSatisfiedAltOutlined";
import "./style.scss";
import {
  checkConversationIsExistOrNot,
  getConversationByUsername,
  getConversations,
  getListOfConversationId,
  getMessagesByConversationId,
} from "api/chatService";
import { getJwtToken } from "utils/cookie";
import { getCurrentUser } from "utils/jwtToken";
import { SOCKET_URL } from "api/constants";
import {
  resolveName,
  resolveUserName,
  splitUserName,
  filterParticipants,
  targetAvatarLayout,
  getStatusOfConversation,
  getAllCurrentInteractionUser,
  handleFilterHashtagOfCaption,
} from "utils/resolveData";
import classNames from "classnames";
import InfiniteScrollReverse from "react-infinite-scroll-reverse";
import InfiniteScroll from "react-infinite-scroll-component";
import { chattingType } from "constant/types";
import { useTranslation } from "react-i18next";
import CustomModal from "components/common/CustomModal";
import ChattingSearch from "components/common/ChattingSearch";
import ThreeDotsAnimation from "components/common/ThreeDotsAnimation";
import InfiniteReverseList from "components/common/InfiniteReverseList";
import { useLongPress } from "use-long-press";
import _ from "lodash";
import InfiniteList from "components/common/InfiniteList";
import useSocket from "hooks/useSocket";
import Picker from "emoji-picker-react";
import { parseTextToEmojis, isOnlyEmojis } from "utils/emoji";
import ImageUploader from "react-images-upload";
import { uploadImages, getPostDetail } from "api/postService";
import { uploadImage } from "api/userService";
import { useHistory } from "react-router-dom";
import {
  calculateFromNow,
  convertDateTimeOnNearest,
  convertUTCtoLocalDate,
} from "utils/calcDateTime";

const ChatPage = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [submitMessage, setSubmitMessage] = useState({});
  const [typingMessage, setTypingMessage] = useState({});
  const [userChatting, setUserChatting] = useState({
    name: "",
    isOnline: false,
    avatars: [],
  });
  const [conversationID, setConversationID] = useState(null);
  const [openChattingSearch, setOpenChattingSearch] = useState(false);
  const [newestVirtualConvId, setNewestVirtualConvId] = useState(0);
  const [typingOnConvList, setTypingOnConvList] = useState([]);
  const [openEmojiPicker, setEmojiPicker] = useState(false);

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

  const { t: trans } = useTranslation();

  const startAudio = () => {
    const notificationAudio = new Audio(require("audio/chat.mp3"));
    notificationAudio.play();
  };
  const onEmojiClick = (event, emojiObject) => {
    setInputMessage(`${inputMessage}${emojiObject.emoji}`);
    setEmojiPicker(true);
  };
  const handleOpenEmojiPicker = () => {
    setEmojiPicker(!openEmojiPicker);
  };

  useEffect(() => {
    if (receivedMessage) {
      const message = receivedMessage;
      switch (message?.messageType) {
        case chattingType.USUAL_TEXT: {
          // startAudio();
          if (message?.sender?.id !== getCurrentUser().accountId) {
            startAudio();
          }
          setSubmitMessage(message);
          break;
        }
        case chattingType.TYPING: {
          setTypingMessage(message);
          break;
        }
        default: {
          break;
        }
      }
    }
  }, [receivedMessage]);

  useEffect(() => {
    if (typingMessage.conversationId) {
      //Check existed item on typing conversation list
      const foundItem = typingOnConvList.filter(
        (item) => item.conversationId === typingMessage.conversationId
      )[0];

      //If not existed => create new item in typing conversation list
      if (!foundItem) {
        setTypingOnConvList([
          ...typingOnConvList,
          {
            conversationId: typingMessage.conversationId,
            usersTyping: [typingMessage.sender],
          },
        ]);
      }
      //If existed => save overlap
      else {
        const currTypingOnConvList = [...typingOnConvList];
        const index = typingOnConvList.indexOf(foundItem);

        if (typingMessage.content === "true") {
          foundItem.usersTyping.push(typingMessage.sender);
          currTypingOnConvList[index] = foundItem;
        } else {
          const filtered = foundItem.usersTyping.filter(
            (user) => user.username !== typingMessage.sender.username
          );
          currTypingOnConvList[index] = filtered;
        }

        setTypingOnConvList(currTypingOnConvList);
      }
    }
  }, [typingMessage]);

  const getIndexOfConversation = (id) => {
    if (conversationList.content) {
      const currConvList = [...conversationList?.content];
      let index;
      currConvList.map((conv, i) => {
        if (conv.id === id) {
          index = i;
        }
      });
      return index;
    }
  };

  useEffect(() => {
    if (newConversation.id) {
      //If new conversation is chat 1vs1
      if (newConversation.participants.length >= 2) {
        const currConversationList = [...conversationList.content];
        let isExistedConv = false;
        let isOnConv = false;

        //Check per item on current conversation list (1vs1)
        if (newConversation.participants.length === 2) {
          currConversationList.map((item, index) => {
            if (item.id === conversationID) {
              isOnConv = true;
            }
            //If found a conversation like new conversation
            if (
              splitUserName(item.participants) ===
              splitUserName(newConversation.participants)
            ) {
              isExistedConv = true;
              currConversationList[index] = newConversation;
              setConversationList({
                ...conversationList,
                content: currConversationList,
              });
            }
          });
        }
        //Group chat
        else {
          currConversationList.map((item, index) => {
            if (item.id === conversationID) {
              isOnConv = true;
            }
            //If found a conversation like new conversation
            if (
              splitUserName(item.participants) ===
                splitUserName(newConversation.participants) &&
              item.id < 0
            ) {
              isExistedConv = true;
              currConversationList[index] = newConversation;
              setConversationList({
                ...conversationList,
                content: currConversationList,
              });
            }
          });
        }

        //If not existed conversation
        if (!isExistedConv) {
          setConversationList({
            ...conversationList,
            content: [newConversation, ...currConversationList],
          });
        }
        //If on new conversation now
        if (isOnConv) {
          setConversationID(newConversation.id);
          setMessageList([...messageList, newConversation.latestMessage]);
        }
        setNewConversation({});
      }
    }
  }, [newConversation]);

  const changeMessage = (e) => {
    setInputMessage(parseTextToEmojis(e.target.value));
  };

  const onClickUserChatting = (conversationId, name, isOnline, avatars) => {
    setUserChatting({ name, isOnline, avatars });
    // getMessageList(conversationId);
    setConversationID(conversationId);
    setInputMessage("");
  };

  const sendMessage = async (event, inputMessage) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (conversationID === null || inputMessage === "") return;
      // Chat in existed conversation
      if (conversationID >= 0) {
        chatInExistedConversation(conversationID, inputMessage);
      }
      //Chat in virtual conversation
      else {
        const participantsOfVirtualConv = conversationList.content.filter(
          (conv) => conv.id === conversationID
        )[0].participants;
        chatInVirtualConversation(
          participantsOfVirtualConv.map((user) => {
            return user.username;
          }),
          inputMessage
        );
      }
      setInputMessage("");
    }
  };

  const handleCloseChattingSearchModal = () => {
    setOpenChattingSearch(false);
  };

  const handleOpenChattingSearchModal = () => {
    const suggestedUsers = getAllCurrentInteractionUser(
      _.slice(conversationList.content, 0, 4)
    );
    localStorage.setItem("suggested_users", JSON.stringify(suggestedUsers));
    setOpenChattingSearch(true);
  };

  const handleCreateNewMessage = (selectedList) => {
    //If length of selected user list = 1 => check existed conversation
    if (selectedList.length === 1) {
      checkConversationIsExistOrNot(selectedList[0].id)
        .then((res) => {
          if (res.status === 200) {
            const { fullName, isOnline, avatar } = selectedList[0];
            const { id: conversationId } = res.data;
            setOpenChattingSearch(false);
            if (
              !conversationList.content.find(
                (conv) => conv.id === conversationId
              )
            ) {
              const currConvList = [
                {
                  ...res.data,
                },
                ...conversationList.content,
              ];
              setConversationList({
                ...conversationList,
                content: currConvList,
              });
            }
            onClickUserChatting(conversationId, fullName, isOnline, [avatar]);
          }
        })
        // Create virtual conversation
        .catch(() => {
          const { fullName, isOnline } = selectedList[0];
          const fullConvParticipants = [
            selectedList[0],
            { ...getCurrentUser(), id: getCurrentUser().accountId },
          ].sort((a, b) => (a.id > b.id ? 1 : -1));
          setOpenChattingSearch(false);
          const currConvList = [
            {
              id: newestVirtualConvId - 1,
              latestMessage: null,
              participants: fullConvParticipants,
            },
            ...conversationList.content,
          ];
          setNewestVirtualConvId(newestVirtualConvId - 1);
          setConversationList({
            ...conversationList,
            content: currConvList,
          });
          setUserChatting({
            name: fullName,
            isOnline,
            avatars: filterParticipants(fullConvParticipants).map((user) => {
              return user.avatar;
            }),
          });
          setMessageList([]);
          setConversationID(newestVirtualConvId - 1);
        });
    }
    // If length of selected user list > 1 => Create virtual conversation
    else {
      const fullConvParticipants = [
        ...selectedList,
        { ...getCurrentUser(), id: getCurrentUser().accountId },
      ].sort((a, b) => (a.id > b.id ? 1 : -1));
      setOpenChattingSearch(false);
      const currConvList = [
        {
          id: newestVirtualConvId - 1,
          latestMessage: null,
          participants: fullConvParticipants,
        },
        ...conversationList.content,
      ];
      setNewestVirtualConvId(newestVirtualConvId - 1);
      setConversationList({
        ...conversationList,
        content: currConvList,
      });
      setUserChatting({
        name: splitUserName(fullConvParticipants),
        isOnline: getStatusOfConversation(fullConvParticipants),
        avatars: filterParticipants(fullConvParticipants).map((user) => {
          return user.avatar;
        }),
      });
      setMessageList([]);
      setConversationID(newestVirtualConvId - 1);
    }
  };

  const handleUpdateParentConversationList = (list) => {
    setConversationList({ ...conversationList, content: list });
  };

  const handleTyping = () => {
    typing(conversationID);
  };

  const handleUntyping = () => {
    untyping(conversationID);
  };

  const handleChangeImg = (img) => {
    const data = new FormData();
    data.append("file", img);
    uploadImage(data)
      .then((res) => {
        if (res.status === 200) {
          const tempEvent = { key: "Enter", preventDefault: () => null };
          sendMessage(tempEvent, `[image|${res.data.url}]`);
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {});
  };

  useEffect(() => {
    // connect();
  }, []);

  useEffect(() => {
    if (submitMessage.id) {
      if (
        conversationList.content.find(
          (conv) => conv.id === submitMessage.conversationId
        )
      ) {
        let index;
        if (conversationID === submitMessage.conversationId) {
          setMessageList([...messageList, submitMessage]);
          index = getIndexOfConversation(conversationID);
        } else {
          index = getIndexOfConversation(submitMessage.conversationId);
        }
        setSubmitMessage({});
        //Save current conversation list and current index
        const currConvList = [...conversationList?.content];

        //Declare target
        const target = currConvList[index];
        target.latestMessage = { ...submitMessage };

        //Update list
        const filtered = currConvList.filter(
          (item) => item.id !== submitMessage.conversationId
        );
        const result = [target, ...filtered];

        setConversationList({ ...conversationList, content: result });
      } else {
        setConversationList({
          ...conversationList,
          content: [
            ...{
              id: submitMessage.conversationId,
              latestMessage: submitMessage.content,
              participants: [
                { ...submitMessage.sender },
                { ...getCurrentUser(), id: getCurrentUser().accountId },
              ],
            },
            ...conversationList.content,
          ],
        });
      }
    }
  }, [submitMessage]);

  useEffect(() => {
    conversationList.content?.map((conv) => {
      if (conv.id === conversationID) {
        setUserChatting({
          name: splitUserName(conv.participants),
          isOnline: getStatusOfConversation(conv.participants),
          avatars: filterParticipants(conv.participants).map((user) => {
            return user.avatar;
          }),
        });
      }
    });
  }, [conversationID]);

  useEffect(() => {
    if (activeUsers.length > 0) {
      const currConvList = [...conversationList.content];
      //Update conversation list 
      currConvList.map((conversation) => {
        conversation.participants?.map((user, index) => {
          if (activeUsers.find((activeUser) => activeUser === user.username)) {
            user.isOnline = true;
          } else {
            user.isOnline = false;
          }
        });
      });
      setConversationList({ ...conversationList, content: currConvList });
      const currentTarget = currConvList.filter(
        (conv) => conv.id === conversationID
      )[0];

      //Update current conversation that user is chatting
      currentTarget.participants?.map((user, index) => {
        if (activeUsers.find((activeUser) => activeUser === user.username)) {
          user.isOnline = true;
        } else {
          user.isOnline = false;
        }
      });
      setUserChatting({
        name: splitUserName(currentTarget.participants),
        isOnline: getStatusOfConversation(currentTarget.participants),
        avatars: filterParticipants(currentTarget.participants).map((user) => {
          return user.avatar;
        }),
      });
    }
  }, [activeUsers]);

  const renderMessageList = () => {
    const usersTypingList = typingOnConvList
      .filter((item) => item.conversationId === conversationID)[0]
      ?.usersTyping.filter(
        (user) => user.username !== getCurrentUser().username
      );

    const renderTypingContainer = () => {
      const restLength = usersTypingList.length - 3;
      return (
        <>
          <Typography
            component="div"
            align="left"
            className="user-list-typing-avatar"
          >
            {_.slice(usersTypingList, 0, 3).map((userTyping) => {
              return (
                <img src={userTyping.avatar} className="user-typing-avatar" />
              );
            })}
            {restLength > 0 && <ThreeDotsAnimation animation={false} />}
          </Typography>
          <Typography component="div" align="left" className="typing-container">
            <ThreeDotsAnimation className="typing-dots" />
            <Typography className="typing-text">
              {_.slice(usersTypingList, 0, 3)
                .map((user) => user.fullName)
                .join(", ")}
              {restLength > 0
                ? ` and ${restLength} other people are typing...`
                : restLength > -2
                ? " are typing"
                : " is typing..."}
            </Typography>
          </Typography>
        </>
      );
    };
    return (
      <>
        {usersTypingList && usersTypingList.length > 0 && (
          <Typography>
            <Typography component="div" align="left" className="latest-action">
              {renderTypingContainer()}
            </Typography>
          </Typography>
        )}
        <InfiniteReverseList
          container={MessageListContainer}
          handleGetData={getMessagesByConversationId}
          data={{
            id: conversationID,
            limit: 10,
            _sort: "timestamp",
            _order: "desc",
          }}
          component={MessageItem}
          noDataComponent={() => <></>}
          handleClickItem={() => <></>}
          setParentDataList={setMessageList}
          parentDataList={messageList}
          submitMessage={submitMessage}
          newConversation={newConversation}
        />
      </>
    );
  };

  return (
    <>
      <Typography component="div" className="chat-container">
        <Typography component="div" className="list-user-container">
          <Typography component="div" className="header">
            <Typography component="div" className="search-btn">
              <SearchIcon className="icon" />
            </Typography>
            <Typography
              component="div"
              className="new-chatting-btn"
              onClick={handleOpenChattingSearchModal}
            >
              <DriveFileRenameOutlineIcon className="icon" />
            </Typography>
          </Typography>
          <InfiniteList
            container={UserListContainer}
            handleGetData={getConversations}
            data={{
              limit: 2,
              _sort: "lastModifiedAt",
              _order: "desc",
            }}
            component={UserItem}
            handleClickItem={onClickUserChatting}
            noDataComponent={() => <></>}
            childProps={{ typingOnConvList, currentConvId: conversationID }}
            parentDataList={conversationList.content}
            setParentDataList={handleUpdateParentConversationList}
          />
        </Typography>
        {conversationID ? (
          <Typography component="div" className="chat-with-user-container">
            <Typography component="div" className="header">
              <Typography component="div" className="user-item">
                <Typography component="div" className="target-avatar">
                  {userChatting.avatars?.map((avatar, index) => {
                    return (
                      <img
                        src={avatar}
                        style={targetAvatarLayout(
                          userChatting.avatars?.length,
                          index,
                          40
                        )}
                      />
                    );
                  })}
                  {userChatting.isOnline && (
                    <Typography className="status-badge online-status"></Typography>
                  )}
                </Typography>
                <Typography component="div" className="user-name-container">
                  <Typography className="username limit-text">
                    {userChatting.name}
                  </Typography>
                  {userChatting.isOnline && (
                    <Typography className="active">
                      {trans("chatting.active")}
                    </Typography>
                  )}
                </Typography>
              </Typography>
              <Typography component="div" className="action-btn">
                <InfoOutlinedIcon className="icon" />
              </Typography>
            </Typography>

            <Typography component="div" className="chat-content">
              {renderMessageList()}
            </Typography>

            <Typography component="div" className="chat-input-container">
              <ClickAwayListener onClickAway={() => setEmojiPicker(false)}>
                <Typography component="div" className="emoji">
                  <SentimentSatisfiedAltOutlinedIcon
                    className="icon"
                    onClick={handleOpenEmojiPicker}
                  />
                  {openEmojiPicker && <Picker onEmojiClick={onEmojiClick} />}{" "}
                </Typography>
              </ClickAwayListener>
              <Typography component="div" className="chat-input">
                <InputBase
                  placeholder={"Message..."}
                  fullWidth={true}
                  maxRows={3}
                  multiline={true}
                  onChange={changeMessage}
                  value={inputMessage}
                  onKeyDown={(event) => sendMessage(event, inputMessage)}
                  onFocus={handleTyping}
                  onBlur={handleUntyping}
                />{" "}
              </Typography>
              <Typography component="div" className="send-images">
                <>
                  {" "}
                  <input
                    className="send-image"
                    type="file"
                    id="change-avatar"
                    name="comment"
                    required
                    onChange={(e) => handleChangeImg(e.target.files[0])}
                  />
                  <label for="change-avatar" className="send-image-input">
                    <ImageOutlinedIcon className="icon" />
                  </label>
                </>
              </Typography>
              <Typography component="div" className="like-icon">
                <FavoriteBorderOutlinedIcon
                  className="icon"
                  onClick={() => {
                    const tempEvent = { key: "Enter" };
                    tempEvent.preventDefault = () => null;
                    sendMessage(tempEvent, parseTextToEmojis("<3"));
                  }}
                />
              </Typography>
            </Typography>
          </Typography>
        ) : (
          <Typography component="div" className="initial-chat-container">
            <img src={require("images/chat.png")} width="100" height="100" />
            <Typography className="your-messages">
              {trans("chatting.yourMessages")}
            </Typography>
            <Typography className="let-send-messages">
              {trans("chatting.letSend")}
            </Typography>
            <Button
              className="send-message-btn"
              onClick={handleOpenChattingSearchModal}
            >
              {trans("chatting.sendMessage")}
            </Button>
          </Typography>
        )}
      </Typography>
      <CustomModal
        isRadius
        width={400}
        height={400}
        open={openChattingSearch}
        handleCloseModal={handleCloseChattingSearchModal}
      >
        <ChattingSearch handleNext={handleCreateNewMessage} />
      </CustomModal>
    </>
  );
};

const MessageItem = ({ item: message, index, dataList: messageList }) => {
  const [postInfo, setPostInfo] = useState(null);
  const [openImageModal, setOpenImageModal] = useState({
    open: false,
    image: "",
  });
  const [showDateTime, setShowDateTime] = useState(false);
  const history = useHistory();

  const getSharePostDetail = (id) => {
    getPostDetail({ id })
      .then((res) => {
        if (res.status === 200) {
          setPostInfo(res.data);
        }
      })
      .catch((err) => {
        throw err;
      });
  };

  useEffect(() => {
    if (message) {
      const sharePost = message.content.match(
        /(?<=\[sharePost\|)(.*?)(?=\])/gi
      );
      const parseIntPostId = sharePost ? parseInt(sharePost[0]) : null;
      if (parseIntPostId) {
        getSharePostDetail(parseIntPostId);
      } else {
        setPostInfo(null);
      }
    }
  }, [message]);
  const condition = message?.sender?.username === getCurrentUser().username;
  const onlyEmojisCondition = isOnlyEmojis(message.content);

  const imageList = message.content.match(/(?<=\[image\|)(.*?)(?=\])/gi);
  const messageClassName = classNames("message-item", {
    owner: condition && !onlyEmojisCondition && !imageList,
    target: !condition && !onlyEmojisCondition && !imageList,
    emojis: onlyEmojisCondition,
    image: imageList,
  });

  const messageContainerClassName = classNames({
    owner: condition,
    target: !condition,
  });
  const showAvatar =
    message?.sender?.username !== messageList[index + 1]?.sender.username;

  const handleClickHashtag = ({ target }) => {
    if (target.nodeName === "HASHTAG") {
      history.push(`/hashtag/${target.textContent.split("#")[1]}`);
    }
  };

  return (
    <>
      <Typography
        component="div"
        className={`message-item-container ${messageContainerClassName}`}
      >
        {!condition && (
          <Typography className="sender-avatar">
            {showAvatar && <img src={message.sender.avatar} />}
          </Typography>
        )}
        {imageList ? (
          <>
            <Tooltip
              title={convertDateTimeOnNearest(message.timestamp)}
              placement={condition ? "left" : "right"}
            >
              <Typography
                className={messageClassName}
                align={condition ? "right" : "left"}
                component="div"
              >
                <img
                  src={imageList[0]}
                  onClick={(e) => {
                    setOpenImageModal({ open: true, image: imageList[0] });
                    e.stopPropagation();
                  }}
                />
              </Typography>
            </Tooltip>
          </>
        ) : (
          <Tooltip
            title={convertDateTimeOnNearest(message.timestamp)}
            placement={condition ? "left" : "right"}
          >
            <Typography
              className={messageClassName}
              align={condition ? "right" : "left"}
              component="div"
            >
              {postInfo ? (
                <Typography component="div" className="share-post-message">
                  <Typography component="div" className="post-owner">
                    <Typography component="div" className="avatar">
                      <img src={postInfo.createdBy.avatar} />
                    </Typography>
                    <Typography
                      component="div"
                      className="username"
                      onClick={() =>
                        history.push(`/profile/${postInfo.createdBy?.username}`)
                      }
                    >
                      {postInfo.createdBy?.username}
                    </Typography>
                  </Typography>
                  <Typography component="div" className="post-content">
                    <Typography
                      component="div"
                      className="attachment"
                      onClick={(e) => {
                        history.push(`/post/${postInfo.id}`);
                        e.stopPropagation();
                      }}
                    >
                      <img src={postInfo.attachments[0].url} />
                    </Typography>
                    <Typography component="div" className="caption">
                      <span
                        onClick={handleClickHashtag}
                        dangerouslySetInnerHTML={{
                          __html: handleFilterHashtagOfCaption(
                            postInfo.caption
                          ),
                        }}
                      />
                    </Typography>
                  </Typography>
                </Typography>
              ) : (
                `${message.content}`
              )}
            </Typography>
          </Tooltip>
        )}
      </Typography>
      {showDateTime && (
        <Typography
          component="div"
          className={`date-time ${messageContainerClassName}`}
        >
          {calculateFromNow(convertUTCtoLocalDate(message.timestamp))}
        </Typography>
      )}
      <CustomModal
        isRadius
        width={800}
        height={800}
        open={openImageModal.open}
        handleCloseModal={() => setOpenImageModal({ open: false, image: "" })}
      >
        <img src={openImageModal.image} width="800px" height="800px" />
      </CustomModal>
    </>
  );
};

const MessageListContainer = ({ _renderItem }) => {
  return <div className="message-list-container">{_renderItem}</div>;
};

const UserListContainer = ({ _renderItem }) => {
  return (
    <Typography component="div" className="user-item-list">
      {_renderItem}
    </Typography>
  );
};

const UserItem = ({
  item: conv,
  handleClick: onClickUserChatting,
  childProps,
}) => {
  if (conv) {
    const { typingOnConvList, currentConvId } = childProps;
    const imageList = conv.latestMessage?.content.match(
      /(?<=\[image\|)(.*?)(?=\])/gi
    );
    const sharePost = conv.latestMessage?.content.match(
      /(?<=\[sharePost\|)(.*?)(?=\])/gi
    );
    const parseIntPostId = sharePost ? parseInt(sharePost[0]) : null;

    const participants = filterParticipants(conv?.participants);
    const userItemClassName = classNames("user-item", {
      active: conv.id === currentConvId,
    });
    const isOnline = getStatusOfConversation(conv.participants);
    const usersTypingList = typingOnConvList
      .filter((item) => item.conversationId === conv.id)[0]
      ?.usersTyping.filter(
        (user) => user.username !== getCurrentUser().username
      );
    return (
      <Typography
        component="div"
        className={userItemClassName}
        onClick={() =>
          onClickUserChatting(
            conv.id,
            splitUserName(conv.participants),
            isOnline,
            participants.map((user) => {
              return user.avatar;
            })
          )
        }
      >
        <Typography component="div" className="target-avatar">
          {participants.map((user, index) => {
            return (
              <>
                <img
                  src={user.avatar}
                  style={targetAvatarLayout(participants.length, index, 40)}
                />
                {isOnline && (
                  <Typography className="status-badge online-status"></Typography>
                )}
              </>
            );
          })}
        </Typography>
        <Typography component="div" className="user-name-container">
          <Typography className="username limit-text">
            {splitUserName(conv.participants)}
          </Typography>
          <Typography className="latest-action limit-text">
            {usersTypingList && usersTypingList.length > 0 ? (
              usersTypingList.length === 1 ? (
                <Typography className="typing-action">
                  <p>{usersTypingList[0].fullName}: </p> <ThreeDotsAnimation />
                </Typography>
              ) : (
                <Typography className="typing-action">
                  <p>{usersTypingList?.length} people: </p>
                  <ThreeDotsAnimation />
                </Typography>
              )
            ) : (
              conv.latestMessage &&
              `${resolveName(conv.latestMessage?.sender.fullName, "fullName")}:
          ${
            imageList
              ? "Image"
              : sharePost
              ? "Post"
              : `${conv.latestMessage?.content}`
          }`
            )}
          </Typography>
        </Typography>
      </Typography>
    );
  } else {
    return <></>;
  }
};

export default ChatPage;
