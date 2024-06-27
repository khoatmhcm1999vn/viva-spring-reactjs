import { IconButton, Tooltip, Typography, Button } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import "./style.scss";

const ReportHeader = ({
  handleApprove,
  handleReject,
  handleCancel,
  reportMessage,
  reportDetailContent,
  isDone = false,
}) => {
  return (
    <Typography component="div" className="header">
      <Typography className="title">
        {reportMessage}
        <Tooltip title={reportDetailContent}>
          <IconButton>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Typography>
      {!isDone && (
        <>
          <Button className="rejected-btn" onClick={handleReject}>
            Rejected
          </Button>
          <Button className="approved-btn" onClick={handleApprove}>
            Approved
          </Button>
        </>
      )}
      <Button className="cancel-btn" onClick={handleCancel}>
        Cancel
      </Button>
    </Typography>
  );
};

export default ReportHeader;
