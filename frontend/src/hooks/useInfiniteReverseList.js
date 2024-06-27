import { useEffect, useState } from "react";
import axios from "axios";
import { getPostsByUserName } from "api/postService";
import axiosConfig from "api/axiosConfig";
import { API_ENDPOINT_KEYS } from "api/constants";
import _ from "lodash";
import { getDifferenceItemBetweenTwoArrays } from "utils/resolveData";

const useInfiniteReverseList = (
  handleGetData,
  data,
  pageNumber,
  newConversation,
  submitMessage,
  parentDataList
) => {
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [isNoData, setNoData] = useState(false);

  useEffect(() => {
    setDataList([]);
  }, []);

  useEffect(() => {
    if (parentDataList.length > 0 || !_.isEqual(parentDataList, dataList)) {
      setDataList(parentDataList);
    }
  }, [parentDataList]);

  useEffect(() => {}, [newConversation]);

  useEffect(() => {
    if (pageNumber > 0) {
      setLoading(true);
      setError(false);
      // let cancel;
      handleGetData({ ...data, page: pageNumber })
        .then((res) => {
          const differenceContent = getDifferenceItemBetweenTwoArrays(res.data.content, dataList);
          const reverseList = [...differenceContent].reverse();
          setDataList((prevDataList) => {
            return [...new Set([...reverseList, ...prevDataList])];
          });
          setHasMore(!res.data.last);
          setLoading(false);
          if (pageNumber === 0 && res.data.content.length === 0) {
            setNoData(true);
          }
        })
        .catch((e) => {
          // if (axios.isCancel(e)) return;
          setError(true);
        });
    }
    // return () => cancel();
  }, [pageNumber]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setNoData(false);
    // let cancel;
    handleGetData({ ...data, page: 0 })
      .then((res) => {
        const differenceContent = getDifferenceItemBetweenTwoArrays(res.data.content, dataList);
        const reverseList = [...differenceContent].reverse();
        setDataList((prevDataList) => {
          return [...new Set([...reverseList])];
        });
        setHasMore(!res.data.last);
        setLoading(false);
        if (res.data.content.length === 0) {
          setNoData(true);
        }
      })
      .catch((e) => {
        // if (axios.isCancel(e)) return;
        setError(true);
      });
    // return () => cancel();
  }, [data.id]);

  return { isLoading, error, dataList, hasMore, isNoData };
};

export default useInfiniteReverseList;
