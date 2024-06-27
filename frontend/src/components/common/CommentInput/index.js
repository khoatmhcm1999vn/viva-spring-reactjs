import { useState, useEffect, useContext } from "react";
import {
  Typography,
  InputBase,
  Button,
  ClickAwayListener,
} from "@mui/material";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import InsertEmoticonOutlinedIcon from "@mui/icons-material/InsertEmoticonOutlined";
import SendIcon from "@mui/icons-material/Send";
import "./style.scss";
import { comment } from "api/postService";
import { useTranslation } from "react-i18next";
import { AuthUser } from "../../../App";
import Picker from "emoji-picker-react";
import { parseTextToEmojis } from "utils/emoji";

const CommentInput = ({
  postId,
  setSubmittedComment,
  hastag,
  parentCommentId = null,
}) => {
  const [commentContent, setCommentContent] = useState("");
  const [openEmojiPicker, setEmojiPicker] = useState(false);

  const Auth = useContext(AuthUser);

  const { t: trans } = useTranslation();

  const handleCaptionChange = (event) => {
    setCommentContent(parseTextToEmojis(event.target.value));
  };

  const onEmojiClick = (event, emojiObject) => {
    setCommentContent(`${commentContent}${emojiObject.emoji}`);
    setEmojiPicker(true);
  };

  const handleOpenEmojiPicker = () => {
    setEmojiPicker(!openEmojiPicker);
  };

  const submitComment = () => {
    comment({
      content: commentContent,
      parentCommentId,
      postId,
    }).then((res) => {
      if (res.status === 200) {
        setSubmittedComment(res.data);
        setCommentContent("");
      }
    });
  };

  return (
    <Typography
      component="div"
      align="left"
      className="draft-comment-container"
    >
      <ClickAwayListener onClickAway={() => setEmojiPicker(false)}>
        <Typography component="div" className="emoji-picker-container">
          <InsertEmoticonOutlinedIcon
            className="emotion-icon"
            onClick={handleOpenEmojiPicker}
          />
          {openEmojiPicker && <Picker onEmojiClick={onEmojiClick} />}{" "}
        </Typography>
      </ClickAwayListener>
      <Typography className="comment-input" component="div">
        <InputBase
          placeholder={trans("newFeed.addComment")}
          fullWidth={true}
          maxRows={4}
          multiline={true}
          onChange={handleCaptionChange}
          value={commentContent}
        />{" "}
      </Typography>
      {!Auth.auth.isAdmin && (
        <Typography className="different-text-icon" component="div">
          <Button className="post-button" onClick={submitComment}>
            {trans("newFeed.post")}
          </Button>
        </Typography>
      )}
    </Typography>
  );
};
export default CommentInput;
