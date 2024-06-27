import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import "./style.scss";
import { useTranslation } from "react-i18next";

const ConfirmDialog = (props) => {
  const { title, handleConfirm, handleClose, open, description } = props;

  const { t: trans } = useTranslation();

  return (
    <div>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title"> {title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {description}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button className="no-btn" onClick={handleClose}>
            {trans("createPost.no")}
          </Button>
          <Button className="yes-btn" onClick={handleConfirm} autoFocus>
            {trans("createPost.yes")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ConfirmDialog;
