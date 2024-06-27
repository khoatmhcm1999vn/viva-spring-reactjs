import * as React from "react";
import { Card, CardContent } from "@mui/material";
import PostContent from "components/common/PostContent";
import Interaction from "components/common/Interaction";
import CommentInput from "components/common/CommentInput";
import CommentList from "components/common/CommentList";
import { convertUTCtoLocalDate } from "utils/calcDateTime";
import "./style.scss";

const Post = (props) => {
  const item = {
    ...props.item,
    createdAt: convertUTCtoLocalDate(props.item.createdAt),
  };
  const { handleClick, index, dataList } = props;
  return (
    <Card sx={{ minWidth: 275 }} className="post-container">
      <CardContent>
        <PostContent
          item={item}
          handleClick={handleClick}
          index={index}
          dataList={dataList}
        />
        <Interaction
          currentPost={item}
          handleClick={handleClick}
          index={index}
          dataList={dataList}
        />
        <CommentInput />
      </CardContent>
    </Card>
  );
};

export default Post;
