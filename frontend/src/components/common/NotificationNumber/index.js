import { Typography } from "@mui/material";
import * as React from "react";
import "./style.scss";

const NotificationNumber = ({ number }) => {
  if (number > 0) {
    return (
      <Typography component="div" className="notification-number">
        {number > 99 ? "99+" : number}
      </Typography>
    );
  } else return <></>;
};

export default NotificationNumber;
