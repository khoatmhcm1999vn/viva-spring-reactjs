import { useState, useEffect, useContext } from "react";
import { Typography, Button, Box, IconButton } from "@mui/material";
import "./style.scss";
import {
  deleteComment,
  getChildCommentListByPostId,
  getFirstLevelCommentListByPostId,
} from "api/postService";
import { convertUTCtoLocalDate, calculateFromNow } from "utils/calcDateTime";
import { substringUsername } from "utils/resolveData";
import CommentInput from "components/common/CommentInput";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import { getCurrentUser } from "utils/jwtToken";
import CustomModal from "../CustomModal";
import useLoading from "hooks/useLoading";
import { AuthUser } from "../../../App";
import { reportContent } from "constant/types";
import InfoIcon from "@mui/icons-material/Info";
import { createCommentReport } from "api/reportService";
import useSnackbar from "hooks/useSnackbar";
import CommentItem from "../CommentItem";
import CommentOptionModal from "../CommentOptionModal";
import ReportDetailModal from "../ReportDetailModal";
import UsernameContainer from "../UsernameContainer";

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

const CommentChildItem = ({
  childCmt,
  handleOpenReplyCmt,
  currentPost,
  handleFilterCommentChild,
  index,
  isOnModal,
}) => {
  const [showCommentOption, setShowCommentOption] = useState(false);
  const { t: trans } = useTranslation();

  const Auth = useContext(AuthUser);
  const [reportModal, setReportModal] = useState({
    open: false,
  });
  const [showOptionModal, setShowOptionModal] = useState(false);

  const handleOpenReportModal = () => {
    setShowOptionModal(false);
    setReportModal({
      ...reportModal,
      open: true,
    });
  };

  const handleCloseReportModal = () => {
    setReportModal({ ...reportModal, open: false });
  };

  return (
    <>
      <Typography
        className="comment-content child"
        onMouseEnter={() => setShowCommentOption(true)}
        onMouseLeave={() => setShowCommentOption(false)}
      >
        <img
          src={
            childCmt.createdBy?.avatar
              ? childCmt.createdBy?.avatar
              : require("images/no-avatar.png")
          }
          width="35"
          height="35"
          alt=""
        />
        <Typography className="content" component="div">
          <Typography className="content-line1" component="div">
            {/* <strong>{substringUsername(childCmt.createdBy?.username)}</strong> */}
            <UsernameContainer
              username={childCmt.createdBy?.username}
              isOnModal={isOnModal}
            />
            {"    "}
            <p className="comment-text-content">{childCmt.content}</p>
          </Typography>
          <Typography className="content-line2" component="div">
            <Typography className="date-time" component="div">
              {childCmt.fromNow}
            </Typography>
            {!Auth.auth.isAdmin && (
              <Typography
                className="reply"
                component="div"
                onClick={() =>
                  handleOpenReplyCmt(
                    substringUsername(childCmt.createdBy?.username)
                  )
                }
              >
                {trans("newFeed.reply")}
              </Typography>
            )}

            {showCommentOption && (
              <Typography className="option" component="div">
                <MoreHorizIcon onClick={() => setShowOptionModal(true)} />
              </Typography>
            )}
          </Typography>
        </Typography>
      </Typography>
      <CustomModal
        isRadius
        width={400}
        height={100}
        open={showOptionModal}
        handleCloseModal={() => setShowOptionModal(false)}
      >
        <CommentOptionModal
          isChild={true}
          index={index}
          currentPost={currentPost}
          comment={childCmt}
          commentId={childCmt.id}
          handleFilterComment={handleFilterCommentChild}
          handleCloseModal={() => setShowOptionModal(false)}
          handleOpenReportModal={handleOpenReportModal}
        />
      </CustomModal>
      <ReportDetailModal
        handleCloseModal={handleCloseReportModal}
        open={reportModal.open}
        type="COMMENT"
        currentTarget={childCmt}
      />
    </>
  );
};

export default CommentChildItem;
