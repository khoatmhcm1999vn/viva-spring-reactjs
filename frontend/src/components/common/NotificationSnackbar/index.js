import { useState } from "react";
import { Snackbar } from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import "./style.scss";

const NotificationSnackbar = (props) => {
  const { open, content, type } = props.snackbarState;
  const vertical = "top";
  const horizontal = "center";

  const renderIcon = () => {
    if (type === "SUCCESS") {
      return <DoneIcon className="snackbar-icon" />;
    }
    if (type === "FAIL") {
      return <CloseIcon className="snackbar-icon" />;
    }
  };

  return (
    <div style={{ "--typeColor": type === "SUCCESS" ? "#0095f6" : "#FF3838" }}>
      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={open}
        message={
          <>
            <p className="snackbar-content">{content}</p>
            {renderIcon()}
          </>
        }
        key={vertical + horizontal}
      />
    </div>
  );
};

export default NotificationSnackbar;
