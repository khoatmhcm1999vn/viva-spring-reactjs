import * as React from "react";
import { Typography } from "@mui/material";
import Carousel from "react-material-ui-carousel";
import "./style.scss";
import { calculateFromNow, convertUTCtoLocalDate } from "utils/calcDateTime";
import { useHistory } from "react-router-dom";
import OutlineProfile from "../OulineProfile";
import { getProfile } from "api/userService";
import CustomPopUp from "../CustomPopUp";
import { substringUsername } from "utils/resolveData";
import UsernameContainer from "components/common/UsernameContainer";

const PostContent = (props) => {
  const { item, handleClick, index, dataList } = props;

  return (
    <>
      <Typography component="div" align="left" className="owner-container">
        <img
          className="avatar"
          src={item.createdBy?.avatar}
          width="40"
          height="40"
          alt=""
        />
        <Typography align="left" component="div" className="right-content">
          <UsernameContainer username={item.createdBy?.username} />
          <Typography className="post-time">
            {calculateFromNow(convertUTCtoLocalDate(item.createdAt))}
          </Typography>
        </Typography>
      </Typography>
      <Typography
        component="div"
        align="center"
        className="post-images"
        onClick={() => handleClick(index, item, dataList)}
      >
        <Carousel
          autoPlay={false}
          className="details-carousel"
          indicators={item.attachments?.length > 1}
          cycleNavigation={item.attachments?.length > 1}
        >
          {item.attachments?.map((item, i) => (
            <img key={i} src={item.url} alt="" />
          ))}
        </Carousel>
      </Typography>
    </>
  );
};
export default PostContent;
