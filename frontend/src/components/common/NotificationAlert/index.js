import { Alert, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { notificationStatus, notificationsType } from "constant/types";
import { calculateFromNow } from "utils/calcDateTime";
import { useState, useEffect } from "react";
import useSocket from "hooks/useSocket";
import NotificationDetail from "components/common/NotificationDetail";
import _ from "lodash";
import "./style.scss";
import {
  removeJwtToken,
  removeLocalStorageField,
  removeRefreshToken,
} from "utils/cookie";
import useSnackbar from "hooks/useSnackbar";

const NotificationAlert = () => {
  const numberOfAlert = 4;
  const [alertData, setAlertData] = useState([]);
  const { states } = useSocket();
  const { newNotification } = states;
  const { setSnackbarState } = useSnackbar();

  useEffect(() => {
    if (!_.isEmpty(newNotification)) {
      setAlertData([...alertData, newNotification]);
      if (
        newNotification.type ===
        notificationsType.ACCOUNT_REPORT_APPROVING_DOMAIN_AUTHOR
      ) {
        setSnackbarState({
          open: true,
          content:
            "Your account violate some our terms, we must block this account!",
          type: "FAIL",
        });
        setTimeout(() => {
          removeJwtToken();
          removeRefreshToken();
          removeLocalStorageField("suggested_users");
          removeLocalStorageField("recent_search");
          window.location.href = "/login";
        }, 3000);
      }
    }
  }, [newNotification]);

  useEffect(() => {
    if (alertData.length === 50) {
      const currentAlert = [...alertData];
      setAlertData(currentAlert.slice(30, 50));
    }
  }, [alertData]);

  const childProps = {
    closeNotification: () => null,
    isAlert: true,
  };

  const handleDeteleAlert = (item) => {
    const filtered = [...alertData].filter((alert) => alert.id !== item.id);
    setAlertData(filtered);
  };

  return (
    <Typography component="div" className="notification-alert-container">
      <Typography component="div" className="notification-alert-list">
        {alertData.length > 0 &&
          alertData.map((item) => {
            return (
              <Typography component="div" className="alert-item">
                <Alert
                  action={
                    <IconButton
                      aria-label="close"
                      size="small"
                      onClick={() => {
                        handleDeteleAlert(item);
                      }}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  }
                  sx={{ mb: 2 }}
                >
                  <NotificationDetail item={item} childProps={childProps} />
                </Alert>
              </Typography>
            );
          })}
      </Typography>
    </Typography>
  );
};

export default NotificationAlert;
