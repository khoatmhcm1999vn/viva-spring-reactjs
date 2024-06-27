import { useState, useEffect } from "react";
import {
  Modal,
  Card,
  CardContent,
  Box,
  AppBar,
  Typography,
} from "@mui/material";
import "./style.scss";

const CustomModal = ({
  title,
  open,
  handleCloseModal,
  width,
  height,
  isRadius = false,
  children,
}) => {
  const [modalWidth, setModalWidth] = useState(0);

  return (
    <Modal
      open={open}
      onClose={() => handleCloseModal(true)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className="custom-modal-container"
      style={{
        "--modalWidth": `${width || 600}px`,
        "--modalHeight": `${height || 600}px`,
        "--radius": `${isRadius ? 14 : 6}px`,
      }}
    >
      <Card className="custom-modal-card">
        <CardContent>
          <Box sx={{ width: "100%" }}>
            {title && (
              <AppBar className="custom-modal-header">
                <Typography component="div" className="title">{title}</Typography>
              </AppBar>
            )}
          </Box>
          {children}
        </CardContent>
      </Card>
    </Modal>
  );
};

export default CustomModal;
