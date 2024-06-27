import { Typography, Card, CardContent, Button } from "@mui/material";
import { useState, useEffect } from "react";
import { calculateFromNow } from "utils/calcDateTime";
import NotificationDetail from "components/common/NotificationDetail";
import { notificationStatus, notificationType } from "constant/types";
import "./style.scss";
import classNames from "classnames";
import InfiniteList from "components/common/InfiniteList";
import {
  getNotificationList,
  updateNotificationItem,
} from "api/notificationService";
import useSocket from "hooks/useSocket";
import NotificationsPausedIcon from "@mui/icons-material/NotificationsPaused";
import _ from "lodash";

const NotificationList = ({ type, changePosition, closeNotification }) => {
  const [isAll, setAll] = useState(true);
  const [parentDataList, setParentDataList] = useState([]);

  const { handlers, states, setStates } = useSocket();
  const { newNotification } = states;
  const { setNewNotification } = setStates;

  useEffect(() => {
    setAll(true);
  }, [type]);

  useEffect(() => {
    console.log({newNotification})
    if (
      newNotification &&
      !_.isEmpty(newNotification) &&
      parentDataList.length > 0
    ) {
      const isExistedNotification = parentDataList.find(
        (noti) => noti.id === newNotification.id
      );
      if (isExistedNotification) {
        const exceptedList = [...parentDataList].filter(
          (noti) => noti.id !== newNotification.id
        );
        setParentDataList([newNotification, ...exceptedList]);
        handleUpdateNotification(
          newNotification.id,
          notificationStatus.RECEIVED
        );
      } else {
        setParentDataList([newNotification, ...parentDataList]);
        handleUpdateNotification(
          newNotification.id,
          notificationStatus.RECEIVED
        );
      }
    }
  }, [newNotification]);

  const handleUpdateNotification = (notificationId, status) => {
    updateNotificationItem({
      id: notificationId,
      status,
    }).then((res) => {
      if (res.status === 200) {
        setNewNotification({});
      }
    });
  };

  const handleFilterChange = () => {
    setAll(!isAll);
  };

  const positionClass = classNames({
    right: type === notificationType.NOTIFICATION,
    left: type === notificationType.MESSAGE,
  });

  const changePositionClass = classNames({
    "animation-change": changePosition === true,
  });

  return (
    <Typography
      component="div"
      className={`notification-list-container ${positionClass} ${changePositionClass}`}
    >
      <Card
        sx={{ minWidth: 275 }}
        className={`notification-list-content ${positionClass}`}
      >
        <CardContent>
          <Typography component="div" className="header">
            <Typography className="title" align="left">
              {type === notificationType.NOTIFICATION
                ? "Notifications"
                : "Messages"}
            </Typography>
            {type === notificationType.NOTIFICATION && (
              <Typography
                className="filter-btn-group"
                align="left"
                component="div"
              >
                <Button
                  className={isAll ? "active" : ""}
                  onClick={!isAll ? handleFilterChange : null}
                >
                  All
                </Button>
                <Button
                  className={!isAll ? "active" : ""}
                  onClick={isAll ? handleFilterChange : null}
                >
                  Unread
                </Button>
              </Typography>
            )}
          </Typography>
          <Typography component="div" className="notification-list">
            {isAll ? (
              <InfiniteList
                container={NotificationListContainer}
                handleGetData={getNotificationList}
                data={{
                  limit: 5,
                  _sort: "timestamp",
                  _order: "desc",
                  username: "",
                }}
                component={NotificationDetail}
                handleClickItem={() => null}
                noDataComponent={() => (
                  <>
                    {" "}
                    <Typography className="no-notification">
                      No notification data <NotificationsPausedIcon />
                    </Typography>
                  </>
                )}
                childProps={{ type, closeNotification, isAlert: false }}
                parentDataList={parentDataList}
                setParentDataList={setParentDataList}
              />
            ) : (
              <InfiniteList
                container={NotificationListContainer}
                handleGetData={getNotificationList}
                data={{
                  limit: 5,
                  _sort: "timestamp",
                  _order: "desc",
                  status: notificationStatus.RECEIVED,
                  username: "",
                }}
                component={NotificationDetail}
                handleClickItem={() => null}
                noDataComponent={() => (
                  <>
                    {" "}
                    <Typography className="no-notification">
                      No notification data <NotificationsPausedIcon />
                    </Typography>
                  </>
                )}
                childProps={{ type, closeNotification, isAlert: false }}
                parentDataList={parentDataList}
                setParentDataList={setParentDataList}
              />
            )}
          </Typography>
        </CardContent>
      </Card>
    </Typography>
  );
};

const NotificationListContainer = ({ _renderItem }) => {
  return <Typography component="div">{_renderItem}</Typography>;
};

export default NotificationList;
