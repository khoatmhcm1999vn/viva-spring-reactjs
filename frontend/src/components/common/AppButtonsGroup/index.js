import * as React from "react";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import { Button, Typography, ClickAwayListener, Box } from "@mui/material";
import NotificationNumber from "components/common/NotificationNumber";
import "./style.scss";
import NotificationList from "components/common/NotificationList";
import classNames from "classnames";
import {
  notificationStatus,
  notificationsType,
  notificationType,
} from "constant/types";
import useSocket from "hooks/useSocket";
import _ from "lodash";
import {
  changeStatusOfAllNotificationFromSentToReceived,
  getNotificationList,
} from "api/notificationService";
import { useHistory } from "react-router-dom";
import { Icon } from "@iconify/react";

const AppButtonsGroup = (props) => {
  const [openNoti, setOpenNoti] = React.useState(false);
  const [openMessage, setOpenMessage] = React.useState(false);
  const [changePosition, setChangePosition] = React.useState(false);
  const [numberOfNotification, setNumberOfNotification] = React.useState(0);

  const { handleOpenCreatePostModal } = props;

  const { handlers, states, setStates } = useSocket();
  const {
    receivedMessage,
    newConversation,
    activeUsers,
    conversationList,
    newNotification,
  } = states;

  const history = useHistory();

  const handleOpenNotificationList = () => {
    if (!openNoti) {
      setNumberOfNotification(0);
      changeStatusOfAllNotificationFromSentToReceived()
        .then((res) => {
          if (res.status === 200) {
            setOpenNoti(true);
          }
        })
        .catch((err) => {
          throw err;
        });
    }
    if (openMessage) {
      setChangePosition(true);
      setOpenMessage(false);
    } else {
      setChangePosition(false);
    }
  };
  const handleOpenMessageList = () => {
    setOpenMessage(!openMessage);
    if (openNoti) {
      setChangePosition(true);
      setOpenNoti(false);
    } else {
      setChangePosition(false);
    }
  };
  const notiBtnClass = classNames({
    active: openNoti,
  });
  const messageBtnClass = classNames({
    active: openMessage,
  });

  const handleGetUnseenNotificationList = () => {
    getNotificationList({
      limit: 1,
      _sort: "timestamp",
      _order: "desc",
      status: notificationStatus.SENT,
      username: "",
    })
      .then((res) => {
        if (res.status === 200) {
          setNumberOfNotification(res.data.totalElements);
        }
      })
      .catch((err) => {
        throw err;
      });
  };

  React.useEffect(() => {
    handleGetUnseenNotificationList();
  }, []);

  const closeNotification = () => {
    setOpenMessage(false);
    setOpenNoti(false);
  };

  React.useEffect(() => {
    // if (!_.isEmpty(newNotification)) {
    //   setNumberOfNotification((prev) => prev + 1);
    // }
    handleGetUnseenNotificationList();
  }, [newNotification]);

  const renderNotificationList = () => {
    if (openMessage) {
      return (
        <NotificationList
          type={notificationType.MESSAGE}
          changePosition={changePosition}
          closeNotification={closeNotification}
        />
      );
    }
    if (openNoti) {
      return (
        <NotificationList
          type={notificationType.NOTIFICATION}
          changePosition={changePosition}
          closeNotification={closeNotification}
        />
      );
    }
  };

  return (
    <Typography className="app-btns-container" component="div" align="center">
      <Typography component="div" className="btn-container">
        <Button onClick={handleOpenCreatePostModal}>
          <Icon icon="akar-icons:plus" width={26} height={26} />
        </Button>
      </Typography>
      <Typography component="div" className="btn-container">
        <Button onClick={() => history.push("/")}>
          <Icon icon="ant-design:home-filled" width={26} height={26} />
        </Button>
      </Typography>
      <Typography component="div" className="btn-container">
        <Button
          onClick={() => {
            if (window.location.pathname !== "/chat") {
              history.push("/chat");
            }
          }}
          className={messageBtnClass}
        >
          <NotificationNumber number={0} />
          <Icon icon="bi:chat-fill" width={26} height={26} />
        </Button>
      </Typography>
      <ClickAwayListener onClickAway={closeNotification}>
        <Typography component="div" className="notification-btns">
          <Typography component="div" className="btn-container">
            <Button
              onClick={handleOpenNotificationList}
              className={notiBtnClass}
            >
              <NotificationNumber number={numberOfNotification} />
              <Icon
                icon="clarity:notification-solid"
                className="notification-icon"
                width={26}
                height={26}
              />
            </Button>
          </Typography>
          {renderNotificationList()}
        </Typography>
      </ClickAwayListener>
    </Typography>
  );
};

export default AppButtonsGroup;
