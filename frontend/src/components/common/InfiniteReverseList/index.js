import { useState, useEffect, useRef, useCallback } from "react";
import useInfiniteReverseList from "hooks/useInfiniteReverseList";
import ReactLoading from "react-loading";
import * as Scroll from "react-scroll";
import { ELement, Link } from "react-scroll";
import "./style.scss";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import _ from "lodash";
import { getCurrentUser } from "utils/jwtToken";

const InfiniteReverseList = (props) => {
  const [pageNumber, setPageNumber] = useState(0);
  const [showViewNewestMessage, setShowViewNewestMessage] = useState(false);
  const [numberOfNewMessage, setNumberOfNewMessage] = useState(0);
  const [isSubmit, setIsSubmit] = useState(false);
  const {
    component: Component,
    container: Container,
    noDataComponent: NoDataComponent,
    handleGetData,
    handleClickItem,
    data,
    setParentDataList,
    parentDataList,
    newConversation,
    submitMessage,
  } = props;
  const { dataList, isLoading, hasMore, isNoData } = useInfiniteReverseList(
    handleGetData,
    data,
    pageNumber,
    newConversation,
    submitMessage,
    parentDataList
  );
  const scroll = Scroll.animateScroll;

  window.addEventListener("scroll", (e) => e.preventDefault());

  const lastItemObserver = useRef();
  const firstItemObserver = useRef();

  const messagesEndRef = useRef(null);
  const newestMessageRef = useRef(null);
  const listRef = useRef(null);
  const testRef = useRef(null);

  const lastItemRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (lastItemObserver.current) lastItemObserver.current.disconnect();
      lastItemObserver.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPageNumber((prevPageNumber) => prevPageNumber + 1);
          }
        },
        { threshold: 1.0 }
      );
      if (node) lastItemObserver.current.observe(node);
    },
    [isLoading, hasMore]
  );

  const firstItemRef = useCallback(
    (node) => {
      testRef.current = node;
      if (isLoading) return;
      if (firstItemObserver.current) firstItemObserver.current.disconnect();
      firstItemObserver.current = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) {
            setShowViewNewestMessage(true);
          } else {
            setShowViewNewestMessage(false);
            setNumberOfNewMessage(0);
          }
        },
        { threshold: 0.1 }
      );
      if (node) firstItemObserver.current.observe(node);
    },
    [pageNumber, data.id]
  );

  const scrollToNewLastItem = () => {
    if (pageNumber > 0 && !isSubmit) {
      messagesEndRef.current?.scrollIntoView();
    } else {
      testRef.current?.scrollIntoView();
      setIsSubmit(false);
    }
    window.scrollTo(0, 0);
  };

  const handleViewNewestMessage = () => {
    testRef.current?.scrollIntoView({ behaviour: "smooth" });
    window.scrollTo(0, 0);
    setNumberOfNewMessage(0);
  };

  useEffect(() => {
    if (submitMessage.id) {
      if (submitMessage.sender?.username !== getCurrentUser().username) {
        setNumberOfNewMessage((prev) => prev + 1);
      } else {
        setIsSubmit(true);
      }
    }
  }, [submitMessage]);

  useEffect(() => {
    if (!_.isEqual(dataList, parentDataList)) {
      setParentDataList(dataList);
    }
    scrollToNewLastItem();
  }, [dataList]);

  useEffect(() => {}, [pageNumber]);

  useEffect(() => {
    setPageNumber(0);
  }, []);

  useEffect(() => {
    setShowViewNewestMessage(false);
    setPageNumber(0);
    setNumberOfNewMessage(0);
  }, [data.id]);

  return (
    <>
      {showViewNewestMessage && (
        <div
          className="view-newest-image-btn"
          onClick={handleViewNewestMessage}
        >
          <ArrowDownwardIcon />
        </div>
      )}
      {showViewNewestMessage && numberOfNewMessage > 0 && (
        <div className="unread-message">
          {numberOfNewMessage > 1
            ? `${numberOfNewMessage} uread messages`
            : `${numberOfNewMessage} uread message`}
        </div>
      )}
      {!isNoData ? (
        <Container
          ref={listRef}
          onScroll={() => null}
          _renderItem={
            <>
              {isLoading && pageNumber > 0 && (
                <ReactLoading
                  className="reverse-loading-more-icon"
                  type="spokes"
                  color="#00000"
                  height={24}
                  width={24}
                />
              )}
              {dataList.length > 0 &&
                dataList.map((item, index) => {
                  if (index === 0) {
                    return (
                      <div ref={lastItemRef} key={item.id}>
                        <Component
                          item={item}
                          key={index}
                          handleClick={handleClickItem}
                          index={index}
                          dataList={dataList}
                        />
                      </div>
                    );
                  } else if (index === dataList.length - pageNumber * 10 - 1) {
                    return (
                      <div ref={messagesEndRef} key={item.id}>
                        <Component
                          item={item}
                          key={index}
                          handleClick={handleClickItem}
                          index={index}
                          dataList={dataList}
                        />
                      </div>
                    );
                  } else if (index === dataList.length - 1) {
                    return (
                      <div ref={firstItemRef} key={item.id}>
                        <Component
                          item={item}
                          key={index}
                          handleClick={handleClickItem}
                          index={index}
                          dataList={dataList}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div key={index}>
                        <Component
                          item={item}
                          key={item.id}
                          handleClick={handleClickItem}
                          index={index}
                          dataList={dataList}
                        />
                      </div>
                    );
                  }
                })}
            </>
          }
        />
      ) : (
        <NoDataComponent />
      )}
    </>
  );
};

export default InfiniteReverseList;
