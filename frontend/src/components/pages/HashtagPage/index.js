import { useState, useEffect } from "react";
import { getHashtagPostList } from "api/hashtagService";
import { withRouter } from "react-router-dom";
import { Box, ImageList, ImageListItem, Typography } from "@mui/material";
import { Helmet } from "react-helmet";
import "./style.scss";
import InfiniteList from "components/common/InfiniteList";
import CustomModal from "components/common/CustomModal";
import PostDetailsModal from "components/common/PostDetailsModal";
import _ from "lodash";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import { useHistory } from "react-router-dom";

const HashtagPage = (props) => {
  const [hashtagInfo, setHashtagInfo] = useState({});
  const [showPostDetailsModal, setShowPostDetailsModal] = useState({
    open: false,
    index: -1,
    item: {},
    dataList: [],
  });
  const history = useHistory();
  const handleGetHashtagPostList = () => {
    getHashtagPostList({
      name: `#${props.match.params.name}`,
      limit: 10,
      page: 0,
    })
      .then((res) => {
        if (res.status === 200) {
          setHashtagInfo(res.data);
        }
      })
      .catch((err) => {
        history.push("/not-found");
        throw err;
      });
  };

  const handleOpenPostDetailsModal = (index, item, dataList) => {
    setShowPostDetailsModal({
      open: true,
      index,
      item,
      dataList,
    });
  };

  const handleCloseOpenPostDetailsModal = (id) => {
    setShowPostDetailsModal({
      open: false,
      index: -1,
      dataLength: 0,
    });
  };

  useEffect(() => {
    handleGetHashtagPostList();
  }, []);
  return (
    <Typography component="div" className="hashtag-page-container">
      <Helmet>
        <title>{`#${props.match.params.name} hashtag`} </title>
      </Helmet>
      <Typography component="div" align="center" className="info-container">
        <Typography
          component="div"
          align="center"
          className="represent-container"
        >
          <Typography
            component="div"
            align="center"
            className="represent-image"
          >
            <img
              src={hashtagInfo.content && hashtagInfo.content[0].firstImage}
            />
          </Typography>
        </Typography>
        <Typography component="div" align="left" className="info-details">
          <Typography
            component="div"
            align="left"
            className="info-detail-line1"
          >
            <Typography className="hashtag-name">
              #{props.match.params.name}
            </Typography>
          </Typography>

          <Typography
            component="div"
            align="left"
            className="info-detail-line2"
          >
            <Typography className="hashtag-posts">
              <strong>{hashtagInfo.totalElements}</strong> posts
            </Typography>
          </Typography>
        </Typography>
      </Typography>

      <Box sx={{ width: "100%" }} className="hashtag-images-list">
        <InfiniteList
          container={ImagesListContainer}
          handleGetData={getHashtagPostList}
          data={{
            name: `#${props.match.params.name}`,
            limit: 9,
          }}
          changedField={props.match.params.name}
          component={ImageItem}
          noDataComponent={() => <h3>No post</h3>}
          handleClickItem={handleOpenPostDetailsModal}
        />
        <CustomModal
          open={showPostDetailsModal.open}
          title={_.startCase(_.toLower(""))}
          handleCloseModal={handleCloseOpenPostDetailsModal}
          width={1240}
          height={800}
        >
          <PostDetailsModal
            index={showPostDetailsModal.index}
            item={showPostDetailsModal.item}
            dataList={showPostDetailsModal.dataList}
            isOnModal={true}
          />
        </CustomModal>
      </Box>
    </Typography>
  );
};

const ImagesListContainer = ({ _renderItem }) => {
  return (
    <>
      <ImageList
        sx={{ width: "100%" }}
        cols={3}
        gap={30}
        style={{ position: "relative", overflow: "hidden" }}
        rowHeight={280}
      >
        {_renderItem}
      </ImageList>
    </>
  );
};

const ImageItem = ({ item, key, handleClick, index, dataList }) => {
  return (
    <ImageListItem
      key={index}
      className="image-item"
      onClick={() => handleClick(index, item, dataList)}
    >
      <img
        src={`${item.firstImage}`}
        srcSet={`${item.firstImage}`}
        alt={item.id}
        loading="lazy"
      />
      {item.multipleImages && (
        <PhotoLibraryIcon className="multi-images-icon" />
      )}
      <Typography className="post-action-btns">
        <Typography className="number-of-action">
          <FavoriteRoundedIcon className="action-icon" />{" "}
          <p>{item.likeCount}</p>
        </Typography>
        <Typography className="number-of-action">
          <ChatBubbleRoundedIcon className="action-icon" />{" "}
          <p>{item.commentCount}</p>
        </Typography>
      </Typography>
    </ImageListItem>
  );
};

export default withRouter(HashtagPage);
