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
import CommentChildItem from "../CommentChildItem";
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

const CommentItem = ({
  comment,
  postId,
  handleFilterComment,
  commentChildList,
  handleUpdateTotalChild,
  handleFilterCommentChild,
  index,
  isReply,
  handleUpdateReply,
  currentPost,
  isOnModal,
}) => {
  const [createdTime, setCreatedTime] = useState(
    calculateFromNow(convertUTCtoLocalDate(comment.createdAt))
  );
  const [total, setTotal] = useState(comment.totalChildComments);

  const [submittedComment, setSubmittedComment] = useState({});
  const [showCommentOption, setShowCommentOption] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);

  const Auth = useContext(AuthUser);
  const [reportModal, setReportModal] = useState({
    open: false,
  });

  useEffect(() => {
    setCreatedTime(calculateFromNow(convertUTCtoLocalDate(comment.createdAt)));
  }, [comment.createdAt]);

  const { t: trans } = useTranslation();

  const handleGetChildCommentList = (page, limit) => {
    getChildCommentListByPostId({
      postId,
      parentCommentId: comment.id,
      _sort: "createdAt",
      _order: "desc",
      limit,
      page,
    })
      .then((res) => {
        if (res.status === 200) {
          // if(childPageNumber !== 0 ){
          let result;
          if (page > 0) {
            result = [..._.reverse(res.data.content), ...commentChildList.data];
          } else {
            result = _.reverse(res.data.content);
          }
          handleUpdateTotalChild(
            {
              open: true,
              data: result.map((item) => {
                return {
                  ...item,
                  fromNow: calculateFromNow(
                    convertUTCtoLocalDate(item.createdAt)
                  ),
                };
              }),
            },
            index
          );
        }
      })
      .catch((err) => {
        throw err;
      });
  };

  const handleToggleCommentChild = () => {
    //Hide child list
    if (total === 0 && commentChildList.open) {
      handleUpdateTotalChild(
        {
          ...commentChildList,
          open: false,
        },
        index
      );
      setTotal(commentChildList?.data.length);
    } else {
      // Show all if the child list is shown before
      if (total === commentChildList?.data.length && !commentChildList.open) {
        handleUpdateTotalChild({ ...commentChildList, open: true }, index);
        setTotal(0);
      }
      // Show list child by using the page number += 1
      else {
        const tempLimit = 3 - (commentChildList?.data.length % 3);
        const newPageNumber = Math.floor(commentChildList?.data.length / 3);
        handleGetChildCommentList(newPageNumber, tempLimit);
        // const newTotal = (childPageNumber + 1) % 3 - length

        setTotal(total - 3 < 0 ? 0 : total - 3);
      }
    }
  };

  const handleOpenReplyCmt = (username) => {
    handleUpdateReply({ open: true, hastag: `@${username}` }, index);
  };

  useEffect(() => {
    if (submittedComment.id) {
      handleUpdateTotalChild(
        {
          open: true,
          data: [
            ...commentChildList?.data,
            {
              ...submittedComment,
              fromNow: calculateFromNow(
                convertUTCtoLocalDate(submittedComment.createdAt)
              ),
            },
          ],
        },
        index
      );
    }
  }, [submittedComment]);

  // setInterval(() => {
  //   setCreatedTime(calculateFromNow(convertUTCtoLocalDate(comment.createdAt)));
  // if (commentChildList.data.length > 0 && commentChildList.open) {
  //   setCommentChildList({
  //     ...commentChildList,
  //     data: commentChildList.data.map((item) => {
  //       return {
  //         ...item,
  //         fromNow: calculateFromNow(convertUTCtoLocalDate(item.createdAt)),
  //       };
  //     }),
  //   });
  // }
  // }, 60000);

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
      <Typography className="comment-container">
        <Typography
          className="comment-content"
          onMouseEnter={() => setShowCommentOption(true)}
          onMouseLeave={() => setShowCommentOption(false)}
        >
          <img
            src={
              comment.createdBy?.avatar
                ? comment.createdBy?.avatar
                : require("images/no-avatar.png")
            }
            width="35"
            height="35"
            alt=""
          />

          <Typography className="content" component="div">
            <Typography className="content-line1" component="div">
              <UsernameContainer
                username={comment.createdBy?.username}
                isOnModal={isOnModal}
              />
              <p className="comment-text-content">{comment.content}</p>
            </Typography>
            <Typography className="content-line2" component="div">
              <Typography className="date-time" component="div">
                {createdTime}
              </Typography>

              {!Auth.auth.isAdmin && (
                <Typography
                  className="reply"
                  component="div"
                  onClick={() =>
                    handleOpenReplyCmt(
                      substringUsername(comment.createdBy?.username)
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
        {(comment.totalChildComments > 0 ||
          commentChildList?.data.length > 0) && (
          <Typography
            className="view-child"
            align="left"
            onClick={handleToggleCommentChild}
          >
            {total === 0
              ? "_____" + trans("newFeed.hideReply")
              : `_____${trans("newFeed.viewReply")} (${total})`}
          </Typography>
        )}
        {commentChildList?.open &&
          commentChildList?.data.map((childCmt) => {
            return (
              <CommentChildItem
                childCmt={childCmt}
                handleOpenReplyCmt={handleOpenReplyCmt}
                currentPost={currentPost}
                comment={comment}
                index={index}
                handleFilterCommentChild={handleFilterCommentChild}
                isOnModal={isOnModal}
              />
            );
          })}
        {isReply.open && (
          <Typography
            className="comment-input-reply"
            component="div"
            align="left"
          >
            <CommentInput
              postId={postId}
              setSubmittedComment={setSubmittedComment}
              hastag={isReply.hastag}
              parentCommentId={comment.id}
            />
          </Typography>
        )}
      </Typography>
      <CustomModal
        isRadius
        width={400}
        height={100}
        open={showOptionModal}
        handleCloseModal={() => setShowOptionModal(false)}
      >
        <CommentOptionModal
          currentPost={currentPost}
          comment={comment}
          commentId={comment.id}
          handleFilterComment={handleFilterComment}
          handleCloseModal={() => setShowOptionModal(false)}
          handleOpenReportModal={handleOpenReportModal}
        />
      </CustomModal>
      <ReportDetailModal
        open={reportModal.open}
        handleCloseModal={handleCloseReportModal}
        type="COMMENT"
        currentTarget={comment}
      />
    </>
  );
};

export default CommentItem;
