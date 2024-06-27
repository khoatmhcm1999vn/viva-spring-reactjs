import { useState } from "react";
import Post from "components/common/Post";
import { getNewFeed, getTrending } from "../../../api/postService";
import InfiniteList from "components/common/InfiniteList";
import "./style.scss";
import CustomModal from "components/common/CustomModal";
import PostDetailsModal from "components/common/PostDetailsModal";
import SuggestedAccounts from "components/common/SuggestedAccounts";
import SuggestedHashtag from "components/common/SuggestedHashtag";
import _ from "lodash";
import NewsfeedInfiniteList from "components/common/NewsfeedInfiniteList";

const ImagesListContainer = ({ _renderItem }) => {
  return <div>{_renderItem}</div>;
};

const PostsListPage = () => {
  const [showPostDetailsModal, setShowPostDetailsModal] = useState({
    open: false,
    index: -1,
    item: {},
    dataList: [],
  });
  const [isUseTrendingApi, setUseTrendingApi] = useState(false);

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
  return (
    <>
      <SuggestedAccounts />
      <SuggestedHashtag />
      <NewsfeedInfiniteList
        container={ImagesListContainer}
        handleGetData={isUseTrendingApi ? getTrending : getNewFeed}
        data={
          isUseTrendingApi
            ? {
                limit: 2,
              }
            : {
                _sort: "createdAt",
                _order: "desc",
                limit: 2,
              }
        }
        component={Post}
        handleClickItem={handleOpenPostDetailsModal}
        noDataComponent={() => <></>}
        setUseTrendingApi={setUseTrendingApi}
        isUseTrendingApi={isUseTrendingApi}
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
          dataList={showPostDetailsModal.dataList}
          setUpdatedItem={() => null}
          isOnModal={true}
        />
      </CustomModal>
    </>
  );
};

export default PostsListPage;
