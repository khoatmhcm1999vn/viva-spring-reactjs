import { useState, useEffect, useContext } from "react";
import { Typography, Button, Box, IconButton } from "@mui/material";
import "./style.scss";
import {
  comment,
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
import classNames from "classnames";

const CommentList = ({
  currentPost,
  submittedComment,
  setSubmittedComment,
  commentReport,
  isOnModal,
}) => {
  const [commentList, setCommentList] = useState([]);
  const [fetchInfo, setFetchInfo] = useState({});
  const [pageNumber, setPageNumber] = useState(0);
  const [totalCommentChildList, setTotalCommentChildList] = useState([]);
  const [totalReply, setTotalReply] = useState([]);

  const { t: trans } = useTranslation();

  const Auth = useContext(AuthUser);

  const handleGetFirstLevelCommentList = (page, postId) => {
    getFirstLevelCommentListByPostId({
      id: postId,
      _sort: "createdAt",
      _order: "desc",
      limit: 15,
      page,
    })
      .then((res) => {
        setFetchInfo(res.data);
        if (page !== 0) {
          if (commentList.length % 15 > 0) {
            const start = commentList.length - page * 15;
            setCommentList([
              ...commentList,
              ..._.slice(res.data.content, start, res.data.content.length),
            ]);
          } else {
            setCommentList([...commentList, ...res.data.content]);
          }
        } else {
          setCommentList(res.data.content);
        }
      })
      .catch((err) => {
        throw err;
      });
  };

  useEffect(() => {
    if (submittedComment.id) {
      setCommentList([submittedComment, ...commentList]);
      setTotalCommentChildList([
        { open: false, data: [] },
        ...totalCommentChildList,
      ]);
      setTotalReply([{ open: false, hastag: "" }, ...totalReply]);
      setSubmittedComment({});
    }
  }, [submittedComment]);

  useEffect(() => {
    handleGetFirstLevelCommentList(pageNumber, currentPost.id);
  }, [pageNumber]);

  useEffect(() => {
    setPageNumber(0);
    handleGetFirstLevelCommentList(0, currentPost.id);
  }, [currentPost]);

  const handleViewMore = () => {
    setPageNumber(pageNumber + 1);
  };

  const handleFilterComment = (commentId) => {
    setCommentList(commentList.filter((cmt) => cmt.id !== commentId));
  };

  const handleUpdateTotalChild = (item, index) => {
    const items = [...totalCommentChildList];
    items[index] = { ...item };
    setTotalCommentChildList(items);
  };

  const handleUpdateReply = (item, index) => {
    const items = [...totalReply];
    items[index] = { ...item };
    setTotalReply(items);
  };

  useEffect(() => {
  }, [totalCommentChildList]);

  const handleFilterCommentChild = (commentId, index) => {
    const listChild = [...totalCommentChildList[index].data];
    const filtered = listChild.filter((child) => child.id !== commentId);
    handleUpdateTotalChild({ open: true, data: filtered }, index);
  };

  const renderCommentReport = () => {
    const isCommentChildClass = classNames("report-comment-content", {
      "child": commentReport.comment.parentComment,
    });
    return (
      <Typography className="report-comment-container">
        <Typography>
          {commentReport.comment.parentComment ? (
            <Typography className="report-comment-content">
              <img
                src={
                  commentReport.comment.parentComment.createdBy?.avatar
                    ? commentReport.comment.parentComment.createdBy?.avatar
                    : require("images/no-avatar.png")
                }
                width="35"
                height="35"
                alt=""
              />

              <Typography className="content" component="div">
                <Typography className="content-line1" component="div">
                  <strong>
                    {substringUsername(
                      commentReport.comment.parentComment.createdBy?.username
                    )}
                  </strong>
                  {"    "}
                  {commentReport?.comment.parentComment.content}
                </Typography>
                <Typography className="content-line2" component="div">
                  <Typography className="date-time" component="div">
                    {calculateFromNow(
                      convertUTCtoLocalDate(
                        commentReport.comment.parentComment.createdAt
                      )
                    )}
                  </Typography>

                  {!Auth.auth.isAdmin && (
                    <Typography className="reply" component="div">
                      {trans("newFeed.reply")}
                    </Typography>
                  )}
                </Typography>
              </Typography>
            </Typography>
          ) : null}
        </Typography>

        <Typography className={isCommentChildClass}>
          <img
            src={
              commentReport.comment?.createdBy?.avatar
                ? commentReport.comment?.createdBy?.avatar
                : require("images/no-avatar.png")
            }
            width="35"
            height="35"
            alt=""
          />

          <Typography className="content" component="div">
            <Typography className="content-line1" component="div">
              <strong>
                {substringUsername(commentReport.comment?.createdBy?.username)}
              </strong>
              {"    "}
              {commentReport?.comment?.content}
            </Typography>
            <Typography className="content-line2" component="div">
              <Typography className="date-time" component="div">
                {calculateFromNow(
                  convertUTCtoLocalDate(commentReport.createdAt)
                )}
              </Typography>

              {!Auth.auth.isAdmin && (
                <Typography className="reply" component="div">
                  {trans("newFeed.reply")}
                </Typography>
              )}
            </Typography>
          </Typography>
        </Typography>
      </Typography>
    );
  };

  const renderFullCommentList = () => {
    return (
      <>
        {commentList.length > 0 ? (
          <Typography className="sended-comments-container">
            {commentList.map((comment, i) => (
              <CommentItem
                currentPost={currentPost}
                comment={comment}
                postId={currentPost.id}
                handleFilterComment={handleFilterComment}
                handleUpdateTotalChild={handleUpdateTotalChild}
                handleFilterCommentChild={handleFilterCommentChild}
                handleUpdateReply={handleUpdateReply}
                index={i}
                commentChildList={
                  totalCommentChildList[i] || { open: false, data: [] }
                }
                isReply={totalReply[i] || { open: false, hastag: "" }}
                isOnModal={isOnModal}
              />
            ))}
            {!fetchInfo.last && (
              <Typography className="view-more" onClick={handleViewMore}>
                {trans("newFeed.viewMoreComment")}
              </Typography>
            )}
          </Typography>
        ) : null}
      </>
    );
  };

  return (
    <>
      {_.isEmpty(commentReport)
        ? renderFullCommentList()
        : renderCommentReport()}
    </>
  );
};

export default CommentList;
