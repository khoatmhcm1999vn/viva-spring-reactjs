import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import CustomModal from "../CustomModal";
import { reportContent } from "../../../constant/types";
import { useState } from "react";
import useSnackbar from "hooks/useSnackbar";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  createAccountReport,
  createCommentReport,
  createPostReport,
  getDetailPostReport,
} from "api/reportService";
import { useTranslation } from "react-i18next";
import "./style.scss";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const ReportDetailModal = ({ open, handleCloseModal, type, currentTarget }) => {
  const [stepValue, setStepValue] = useState(0);
  const [globalState, setGlobalState] = useState({});
  const { setSnackbarState } = useSnackbar();

  const { t: trans } = useTranslation();

  const handleCreateReport = (item) => {
    setGlobalState(item);
    handleNextStep();
  };

  const handlePrevStep = () => {
    setStepValue(stepValue - 1);
  };

  const handleSubmitReport = () => {
    const reportData = {
      content: globalState.content,
      sentitiveType: globalState.sentitiveType,
    };
    if (type === "POST") {
      reportData.postId = currentTarget.id;
      createPostReport(reportData)
        .then((res) => {
          if (res.status === 200) {
            setSnackbarState({
              open: true,
              content: "You have reported successfully",
              type: "SUCCESS",
            });
            handleNextStep();
          }
        })
        .catch((err) => {
          throw err;
        })
        .finally(() => {
          // setLocalLoading(false);
        });
    }
    if (type === "COMMENT") {
      reportData.commentId = currentTarget.id;
      createCommentReport(reportData)
        .then((res) => {
          if (res.status === 200) {
            setSnackbarState({
              open: true,
              content: "You have reported successfully",
              type: "SUCCESS",
            });
            handleNextStep();
          }
        })
        .catch((err) => {
          throw err;
        })
        .finally(() => {
          // setLocalLoading(false);
        });
    }
    if (type === "ACCOUNT") {
      reportData.accountId = currentTarget.id;
      createAccountReport(reportData)
        .then((res) => {
          if (res.status === 200) {
            setSnackbarState({
              open: true,
              content: "You have reported successfully",
              type: "SUCCESS",
            });
            handleNextStep();
          }
        })
        .catch((err) => {
          throw err;
        })
        .finally(() => {
          // setLocalLoading(false);
        });
    }
  };

  const handleNextStep = () => {
    setStepValue(stepValue + 1);
  };

  const handleCloseReportModal = () => {
    handleCloseModal();
    setStepValue(0);
  };

  const StepOne = () => {
    return (
      <CustomModal
        isRadius
        width={400}
        height={500}
        title="Report"
        open={open}
        handleCloseModal={handleCloseReportModal}
      >
        <Typography component="div" className="report-modal-step1">
          <Typography className="report-question">
            {trans("report.whyReport")}
          </Typography>
          <Typography component="div" align="left" className="report-content">
            {reportContent.map((item, index) => (
              <Typography
                className="report-item"
                onClick={() => handleCreateReport(item)}
              >
                <p>{trans(item.content)}</p>
                <ChevronRightIcon />
              </Typography>
            ))}
          </Typography>
        </Typography>
      </CustomModal>
    );
  };

  const StepTwo = () => {
    return (
      <CustomModal
        isRadius
        width={400}
        height={500}
        title={""}
        open={open}
        handleCloseModal={handleCloseReportModal}
      >
        <Typography component="div" className="report-modal-step2">
          <Typography component="div" className="report-header">
            <p>Report</p>
            <Button onClick={handlePrevStep} className="back-btn">
              <ChevronLeftIcon />
            </Button>
          </Typography>
          <Typography className="report-question">
            {trans("report.whyReport")}
          </Typography>
          <Typography className="reason-list-container">
            {globalState.detailContent
              ? trans(globalState?.detailContent)
                  .split("\n")
                  .map((item, index) => (
                    <>
                      <li key={item.id}>{item}</li>
                    </>
                  ))
              : null}
          </Typography>
          <Button className="submit-btn" onClick={handleSubmitReport}>
            {trans("report.sendReport")}
          </Button>
        </Typography>
      </CustomModal>
    );
  };

  const StepThree = (target) => {
    return (
      <CustomModal
        isRadius
        width={400}
        height={300}
        title={""}
        open={open}
        handleCloseModal={handleCloseReportModal}
      >
        <Typography component="div" className="report-modal-step3">
          <img
            className="action-complete-icon"
            src={require("images/action-complete.png")}
          />
          <Typography className="action-complete-label">
            {trans("report.thankYou")}
          </Typography>
          <Typography className="thank-you-label">
            {" "}
            Your feedback is important in helping us keep the Vivacon community
            safe.
          </Typography>
          <Typography className="other-action-btns">
            <Button className="block-action">
              Block @{target.createdBy?.username || target?.username}
            </Button>
            <Button className="unfollow-action">
              Unfollow @{target.createdBy?.username || target?.username}
            </Button>
          </Typography>
          <Button className="close-btn" onClick={handleCloseReportModal}>
            Close
          </Button>
        </Typography>
      </CustomModal>
    );
  };
  return (
    <Typography className="report-detail-modal">
      {" "}
      <TabPanel value={stepValue} index={0}>
        {StepOne()}
      </TabPanel>
      <TabPanel value={stepValue} index={1}>
        {StepTwo()}
      </TabPanel>
      <TabPanel value={stepValue} index={2}>
        {StepThree(currentTarget)}
      </TabPanel>
    </Typography>
  );
};
export default ReportDetailModal;
