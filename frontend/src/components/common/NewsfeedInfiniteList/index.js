import { useState, useEffect, useRef, useCallback } from "react";
import ReactLoading from "react-loading";
import "./style.scss";
import _ from "lodash";
import useNewsfeedInfiniteList from "hooks/useNewsfeedInfiniteList";

const NewsfeedInfiniteList = (props) => {
  const [pageNumber, setPageNumber] = useState(0);
  const {
    component: Component,
    container: Container,
    noDataComponent: NoDataComponent,
    handleGetData,
    handleClickItem,
    data,
    activeCondition = null,
    childProps,
    parentDataList,
    setParentDataList,
    changedField = null,
    setUseTrendingApi,
    isUseTrendingApi,
  } = props;
  const { dataList, isLoading, hasMore, isNoData } = useNewsfeedInfiniteList(
    handleGetData,
    data,
    pageNumber,
    parentDataList,
    changedField,
    isUseTrendingApi
  );

  const observer = useRef();

  useEffect(() => {
    setPageNumber(0);
  }, []);

  useEffect(() => {
    if (data.username) {
      setPageNumber(0);
    }
  }, [data.username]);

  useEffect(() => {
    setPageNumber(0);
  }, [data.status]);

  useEffect(() => {
    if (!_.isEqual(dataList, parentDataList) && parentDataList) {
      setParentDataList(dataList);
    }
  }, [dataList]);

  useEffect(() => {
    if (isUseTrendingApi) {
      setPageNumber(0);
    }
  }, [isUseTrendingApi]);

  const lastItemRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPageNumber((prevPageNumber) => prevPageNumber + 1);
          }
          console.log("entries and hasmore: ", {
            entries: entries[0].isIntersecting,
            hasMore,
            isUseTrendingApi,
          });
          if (entries[0].isIntersecting && !hasMore && !isUseTrendingApi) {
            setUseTrendingApi(true);
            // setPageNumber(0);
          }
        },
        { threshold: 1.0 }
      );
      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore]
  );

  return (
    <>
      {!isNoData ? (
        <Container
          _renderItem={
            <>
              {dataList &&
                dataList.map((item, index) => {
                  if (dataList.length === index + 1) {
                    return (
                      <div ref={lastItemRef} key={item.id}>
                        <Component
                          item={item}
                          key={index}
                          handleClick={handleClickItem}
                          index={index}
                          dataList={dataList}
                          activeCondition={activeCondition}
                          childProps={childProps}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div key={item.id}>
                        <Component
                          item={item}
                          key={index}
                          handleClick={handleClickItem}
                          index={index}
                          dataList={dataList}
                          activeCondition={activeCondition}
                          childProps={childProps}
                        />
                      </div>
                    );
                  }
                })}
              {isLoading && pageNumber > 0 && (
                <ReactLoading
                  className="loading-more-icon"
                  type="spokes"
                  color="#00000"
                  height={36}
                  width={36}
                />
              )}
            </>
          }
        />
      ) : (
        <NoDataComponent />
      )}
    </>
  );
};

export default NewsfeedInfiniteList;
