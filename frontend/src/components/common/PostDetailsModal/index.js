import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import "./style.scss";
import { getPostDetail } from "api/postService";
import Carousel from "react-material-ui-carousel";
import { getCurrentUser } from "utils/jwtToken";
import CommentInput from "../CommentInput";
import FollowButton from "../FollowButton";
import Interaction from "../Interaction";
import { calculateFromNow, convertUTCtoLocalDate } from "utils/calcDateTime";
import CommentList from "../CommentList";
import { substringUsername } from "utils/resolveData";
import { useHistory } from "react-router-dom";
import CustomPopUp from "../CustomPopUp";
import { PopUpContent } from "components/pages/ProfilePage";
import { AuthUser } from "App";
import useSnackbar from "hooks/useSnackbar";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
  createPostReport,
  getDetailPostReport,
} from "../../../api/reportService";
import CustomModal from "../CustomModal";
import { reportContent } from "../../../constant/types";
import InfoIcon from "@mui/icons-material/Info";
import ReportDetailModal from "../ReportDetailModal";
import PostOptionModal from "../PostOptionModal";
import UsernameContainer from "../UsernameContainer";

const PostDetailsModal = ({ index, dataList, title, reportId, isOnModal }) => {
  const [currentIndex, setCurrentIndex] = useState(index);
  const [currentPost, setCurrentPost] = useState({});
  const [showPopUp, setShowPopUp] = useState({
    open: false,
    id: -1,
    showInImage: false,
  });

  const [reportModal, setReportModal] = useState({
    open: false,
    data: {},
  });

  const [showOptionModal, setShowOptionModal] = useState(false);

  const [currentReportID, setCurrentReportID] = useState(reportId);

  const [submittedComment, setSubmittedComment] = useState({});

  const [commentReport, setCommentReport] = useState({});

  const Auth = useContext(AuthUser);

  const history = useHistory();
  const handleGetPostDetail = () => {
    getPostDetail({
      id: dataList[currentIndex]?.id,
      _sort: "createdAt",
      _order: "desc",
    }).then((res) => {
      setCurrentPost({
        ...res.data,
        lastModifiedAt: convertUTCtoLocalDate(res.data.lastModifiedAt),
      });
    }).catch((err) => {
      history.replace('/not-found');
      throw err;
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
    if (currentIndex === 0) {
      handleGetPostDetail();
    }
  }, [dataList[currentIndex]?.id]);

  useEffect(() => {
    setCurrentReportID(reportId);
  }, [reportId]);

  useEffect(() => {
    getDetailPostReport(currentReportID).then((res) =>
      setCommentReport(res.data)
    );
  }, [currentReportID]);

  const handleIncreaseIndex = () => {
    setCurrentIndex(currentIndex + 1);
    setCurrentReportID(dataList[currentIndex + 1].id);
  };

  const handleDecreaseIndex = () => {
    setCurrentIndex(currentIndex - 1);
    setCurrentReportID(dataList[currentIndex - 1].id);
  };

  const handleOpenReportModal = (userInfo) => {
    setShowOptionModal(false);
    setReportModal({
      open: true,
      data: userInfo,
    });
  };

  const handleCloseReportModal = () => {
    setReportModal({ ...reportModal, open: false });
  };

  const handleOpenOptionModal = () => {
    setShowOptionModal(true);
  };

  return (
    <>
      {currentPost.id ? (
        <>
          <Typography component="div" className="post-details-container">
            {currentIndex > 0 && (
              <div className="minus-post-index">
                <Button onClick={handleDecreaseIndex}>
                  <ChevronLeftIcon className="icon" />
                </Button>
              </div>
            )}
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
                  <UsernameContainer
                    username={currentPost.createdBy?.username}
                    isOnModal={isOnModal}
                  />
                  <Typography className="post-more-actions">
                    {" "}
                    <MoreHorizIcon
                      className="post-more-icon"
                      onClick={handleOpenOptionModal}
                    />
                  </Typography>
                </Typography>
                <Typography component="div" className="interaction-line2">
                  <CommentList
                    currentPost={currentPost}
                    submittedComment={submittedComment}
                    setSubmittedComment={setSubmittedComment}
                    isOnModal={isOnModal}
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
                    {calculateFromNow(currentPost.lastModifiedAt)}
                  </Typography>
                </Typography>
                <Typography component="div" className="interaction-line4">
                  <CommentInput
                    postId={currentPost.id}
                    setSubmittedComment={setSubmittedComment}
                  />
                </Typography>
              </Typography>
            </Typography>

            {currentIndex < dataList.length - 1 && (
              <div className="plus-post-index">
                <Button onClick={handleIncreaseIndex}>
                  <ChevronRightIcon className="icon" />
                </Button>
              </div>
            )}
          </Typography>
          <CustomModal
            isRadius
            width={400}
            height={200}
            open={showOptionModal}
            handleCloseModal={() => setShowOptionModal(false)}
          >
            <PostOptionModal
              postId={currentPost.id}
              post={currentPost}
              handleFilterComment={() => null}
              handleCloseModal={() => setShowOptionModal(false)}
              handleOpenReportModal={handleOpenReportModal}
            />
          </CustomModal>
          <ReportDetailModal
            handleCloseModal={handleCloseReportModal}
            open={reportModal.open}
            type="POST"
            currentTarget={currentPost}
          />
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default PostDetailsModal;
