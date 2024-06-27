import { Typography } from "@mui/material";
import classNames from "classnames";
import * as React from "react";
import { notificationStatus, notificationsType } from "constant/types";
import { calculateFromNow, convertUTCtoLocalDate } from "utils/calcDateTime";
import "./style.scss";
import { useHistory } from "react-router-dom";
import { updateNotificationItem } from "api/notificationService";

const NotificationDetail = ({ item, type, childProps }) => {
  const { closeNotification, isAlert } = childProps;
  const history = useHistory();

  const handleUpdateNotification = (status) => {
    updateNotificationItem({
      id: item.id,
      status,
    }).then((res) => {
      if (res.status === 200) {
      }
    });
  };

  const handleClickNotificationItem = () => {
    if (item.type !== notificationsType.FOLLOWING_ON_ME) {
      history.push(`/post/${item.presentationId}`);
    } else {
      history.push(`/profile/${item.actionAuthor.username}`);
    }
    handleUpdateNotification(notificationStatus.SEEN);
    closeNotification();
  };

  const renderNotificationContent = (item) => {
    const actionAuthor = item?.actionAuthor.fullName;
    if (
      item.type === notificationsType.REPLY_ON_COMMENT ||
      item.type === notificationsType.COMMENT_ON_POST ||
      item.type === notificationsType.AWARE_ON_COMMENT ||
      item.type === notificationsType.LIKE_ON_POST ||
      item.type === notificationsType.FOLLOWING_ON_ME
    ) {
      return (
        <>
          <Typography component="div" className="present-image">
            <img src={item.actionAuthor.avatar} width="50" height="50" />
          </Typography>
          <Typography
            component="div"
            className="notification-content"
            align="left"
          >
            <Typography component="div" className="owner-activity">
              <Typography component="div" className="notification-activity">
                <p>
                  <strong>{actionAuthor}</strong>{" "}
                  {item.content.split(actionAuthor)[1]}
                </p>
              </Typography>
              <Typography className="notification-from-now">
                {calculateFromNow(
                  convertUTCtoLocalDate(new Date(item.timestamp))
                )}
              </Typography>
            </Typography>
          </Typography>
          <Typography component="div" className="noti-in-post">
            {item.type !== notificationsType.FOLLOWING_ON_ME && (
              <img src={item.domainImage} width="50" height="50" />
            )}
          </Typography>
          {item.status !== notificationStatus.SEEN && (
            <Typography component="div" className="seen-dot"></Typography>
          )}
        </>
      );
    } else {
      return (
        <>
          <Typography component="div" className="present-image">
            <img src={require("images/LOGO4.png")} width="50" height="25" />
          </Typography>
          <Typography
            component="div"
            className="notification-content"
            align="left"
          >
            <Typography component="div" className="owner-activity">
              <Typography component="div" className="notification-activity">
                <p>{item.content}</p>
              </Typography>
              <Typography className="notification-from-now">
                {calculateFromNow(
                  convertUTCtoLocalDate(new Date(item.timestamp))
                )}
              </Typography>
            </Typography>
          </Typography>
          {item.status !== notificationStatus.SEEN && (
            <Typography component="div" className="seen-dot"></Typography>
          )}
        </>
      );
    }
  };

  const unreadStyle = classNames("notification-container", {
    unread: item.status === !isAlert && notificationStatus.SENT,
  });
  return (
    <Typography
      component="div"
      className={unreadStyle}
      onClick={handleClickNotificationItem}
    >
      {renderNotificationContent(item)}
    </Typography>
  );
};
export default NotificationDetail;
