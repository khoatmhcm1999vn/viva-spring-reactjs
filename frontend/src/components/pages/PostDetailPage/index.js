import { Typography } from "@mui/material";
import PostDetailsModal from "components/common/PostDetailsModal";
import { useState, useEffect } from "react";
import { withRouter } from "react-router-dom";
import "./style.scss";

const PostDetailPage = (props) => {
  const [postId, setPostId] = useState(props.match.params.id);
  useEffect(() => {
    setPostId(props.match.params.id);
  }, [props.match.params.id]);
  return (
    <Typography component="div" className="post-detail-page-container">
      <PostDetailsModal
        index={0}
        dataList={[{ id: postId }]}
        isOnModal={true}
      />
    </Typography>
  );
};

export default withRouter(PostDetailPage);
