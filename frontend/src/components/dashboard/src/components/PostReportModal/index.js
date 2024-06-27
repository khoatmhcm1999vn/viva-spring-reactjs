import { Box, Button, IconButton, Typography } from "@mui/material";
import { useEffect, useState, useContext } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./style.scss";
import { getPostDetail } from "api/postService";
import Carousel from "react-material-ui-carousel";

import CommentInput from "../../../../common/CommentInput";

import Interaction from "../../../../common/Interaction";
import { calculateFromNow, convertUTCtoLocalDate } from "utils/calcDateTime";
import CommentList from "../../../../common/CommentList";
import { substringUsername } from "utils/resolveData";
import { useHistory } from "react-router-dom";

import CustomModal from "../../../../common/CustomModal";
import { reportContent } from "../../../../../constant/types";
import InfoIcon from "@mui/icons-material/Info";
import {
  createPostReport,
  getDetailCommentReport,
} from "../../../../../api/reportService";
import useSnackbar from "../../../../../hooks/useSnackbar";
import { AuthUser } from "App";
import { getPostOnAnyStatus } from "api/adminService";

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

const PostReportModal = ({ index, dataList, title, reportId, type }) => {
  const [currentIndex, setCurrentIndex] = useState(index);
  const [currentPost, setCurrentPost] = useState({});
  const [showPopUp, setShowPopUp] = useState({
    open: false,
    id: -1,
    showInImage: false,
  });

  const [currentReportID, setCurrentReportID] = useState(reportId);

  const [submittedComment, setSubmittedComment] = useState({});

  const [commentReport, setCommentReport] = useState({});

  const history = useHistory();
  const handleGetPostDetail = () => {
    getPostOnAnyStatus({
      id:
        type === "comment"
          ? dataList[currentIndex]?.comment.post.id
          : dataList[currentIndex]?.post.id,
      _sort: "createdAt",
      _order: "desc",
    }).then((res) => {
      setCurrentPost({
        ...res.data,
        lastModifiedAt: convertUTCtoLocalDate(res.data.lastModifiedAt),
      });
    });
  };

  const navigateToUser = (username) => {
    history.push(`/profile/${username}`);
  };
  const handleOpenPopUp = (id, showInImage) => {
    setShowPopUp({
      open: true,
      id,
      showInImage,
    });
  };

  const handleClosePopUp = () => {
    setShowPopUp({
      open: false,
      id: -1,
    });
  };

  useEffect(() => {
    handleGetPostDetail();
  }, [currentIndex]);

  useEffect(() => {
    setCurrentReportID(reportId);
  }, [reportId]);

  useEffect(() => {
    getDetailCommentReport(currentReportID).then((res) =>
      setCommentReport(res.data)
    );
  }, [currentReportID]);

  return (
    <>
      {currentPost.id ? (
        <Typography component="div" className="post-details-container">
          <Typography component="div" className="post-details-carousel">
            <Carousel
              autoPlay={false}
              className="details-carousel"
              indicators={currentPost.attachments?.length > 1}
              cycleNavigation={currentPost.attachments?.length > 1}
            >
              {currentPost.attachments?.map((item, i) => (
                <img key={i} src={item.url} alt="" />
              ))}
            </Carousel>
          </Typography>

          <Typography component="div" className="post-details-interation">
            <Typography component="div" className="details-top-content">
              <Typography component="div" className="interaction-line1">
                <img
                  src={currentPost.createdBy?.avatar}
                  width={35}
                  height={35}
                />
                <Typography
                  className="owner-name"
                  component="div"
                  onMouseEnter={() =>
                    handleOpenPopUp(currentPost.createdBy?.id, false)
                  }
                  onMouseLeave={handleClosePopUp}
                >
                  <Typography
                    className="username"
                    onClick={() =>
                      navigateToUser(currentPost.createdBy?.username)
                    }
                  >
                    {substringUsername(currentPost.createdBy?.username)}
                  </Typography>
                </Typography>
              </Typography>
              <Typography component="div" className="interaction-line2">
                <CommentList
                  currentPost={currentPost}
                  submittedComment={submittedComment}
                  setSubmittedComment={setSubmittedComment}
                  commentReport={commentReport}
                />
              </Typography>
            </Typography>
            <Typography component="div" className="details-bottom-content">
              <Typography component="div" className="interaction-line3">
                <Interaction
                  currentPost={currentPost}
                  setCurrentPost={setCurrentPost}
                />
                <Typography className="post-time-fromnow" align="left">
                  {calculateFromNow(
                    convertUTCtoLocalDate(currentPost.lastModifiedAt)
                  )}
                </Typography>
              </Typography>
            </Typography>
          </Typography>
        </Typography>
      ) : (
        <></>
      )}
    </>
  );
};

export default PostReportModal;
