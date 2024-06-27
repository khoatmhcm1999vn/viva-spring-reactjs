import { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  ClickAwayListener,
  InputBase,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";
import { searchAccountsByKeyword } from "api/userService";
import "./style.scss";
import classNames from "classnames";
import { useHistory } from "react-router-dom";
import { saveSearchList } from "utils/resolveData";
import CloseIcon from "@mui/icons-material/Close";
import ReactLoading from "react-loading";
import CustomModal from "../CustomModal";

const AppSearchInput = () => {
  const [searchText, setSearchText] = useState("");
  const [resultList, setResultList] = useState([]);
  const [isStartSearch, setStartSearch] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const [recentSearchList, setRecentSearchList] = useState(
    JSON.parse(localStorage.getItem("recent_search")) || []
  );
  const [fetchInfo, setFetchInfo] = useState({});
  const [showRecentSearch, setShowRecentSearch] = useState(false);
  const [isLocalLoading, setLocalLoading] = useState(false);
  const [firstLocalLoading, setFirstLocalLoading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);

  const scrollRef = useRef();
  const { t: trans } = useTranslation();
  const history = useHistory();
  const searchAccounts = (page) => {
    setLocalLoading(true);
    if (page === 0) {
      setFirstLocalLoading(true);
    }
    searchAccountsByKeyword({
      keyword: searchText,
      page,
      _sort: "username",
      _order: "asc",
      limit: 2,
    })
      .then((res) => {
        if (res.status === 200) {
          setFetchInfo(res.data);
          if (page === 0) {
            setResultList(res.data.content);
            setFocusIndex(0);
          } else {
            setResultList([...resultList, ...res.data.content]);
            setFocusIndex(resultList.length);
          }
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setLocalLoading(false);
        setFirstLocalLoading(false);
      });
  };

  const changeSearchText = (e) => {
    setSearchText(e.target.value);
    if (e.target.value === "") {
      handleShowRecentSearch(e.target.value);
    } else {
      setShowRecentSearch(false);
      setRecentSearchList([]);
    }
    setStartSearch(false);
  };

  const handleChangeFocusIndexByKey = (event) => {
    if (event.keyCode === 40 && focusIndex < resultList.length - 1) {
      event.preventDefault();
      setFocusIndex(focusIndex + 1);
    }
    if (event.keyCode === 38 && focusIndex > 0) {
      event.preventDefault();
      setFocusIndex(focusIndex - 1);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      setSearchText("");
      event.target.blur();
      saveResult(resultList[focusIndex]);
      history.push(`/profile/${resultList[focusIndex].username}`);
    }
  };
  const handleChangeFocusIndexByMove = (index) => {
    setFocusIndex(index);
  };

  const accessUserProfile = (list) => {
    setSearchText("");
    saveResult(list[focusIndex]);
    hideResultList();
    history.push(`/profile/${list[focusIndex].username}`);
  };

  const hideResultList = () => {
    setStartSearch(false);
    setRecentSearchList([]);
    setResultList([]);
  };

  const saveResult = (account) => {
    const currSavingList =
      JSON.parse(localStorage.getItem("recent_search")) || [];
    const res = saveSearchList(currSavingList, account);
    localStorage.setItem("recent_search", JSON.stringify(res));
  };

  const handleShowRecentSearch = (text) => {
    if (text === "") {
      setRecentSearchList(
        JSON.parse(localStorage.getItem("recent_search")) || []
      );
      setShowRecentSearch(true);
    } else {
      setShowRecentSearch(false);
    }
  };

  const handleDeleteRecentSearchItem = (item, event) => {
    if (event && event.stopPropagation) event.stopPropagation();
    const currSavingList =
      JSON.parse(localStorage.getItem("recent_search")) || [];
    const filtered = currSavingList.filter(
      (searchItem) => searchItem.id !== item.id
    );
    setRecentSearchList(filtered);
    localStorage.setItem("recent_search", JSON.stringify(filtered));
  };

  const handleClearAll = () => {
    setRecentSearchList([]);
    localStorage.setItem("recent_search", JSON.stringify([]));
    setShowClearModal(false);
  };

  const handleViewMore = () => {
    setPageNumber(pageNumber + 1);
    searchAccounts(pageNumber + 1);
  };

  useEffect(() => {
    if (searchText !== "") {
      setTimeout(() => {
        setStartSearch(true);
      }, 2000);
    }
  }, [searchText]);

  useEffect(() => {
    if (isStartSearch) {
      if (searchText !== "") {
        setPageNumber(0);
        searchAccounts(0);
      }
    }
  }, [isStartSearch]);

  return (
    <>
      <ClickAwayListener onClickAway={hideResultList}>
        <Typography className="app-search" component="div" align="center">
          <SearchIcon className="search-icon" />
          <InputBase
            className="search-text"
            placeholder={`${trans("navbar.search")}...`}
            onChange={changeSearchText}
            value={searchText}
            onKeyDown={handleChangeFocusIndexByKey}
            // ref={inputRef}
            onFocus={() => handleShowRecentSearch(searchText)}
          />
          {firstLocalLoading ? (
            <Typography component="div" className="account-result">
              <ReactLoading
                className="loading-icon"
                type="spokes"
                color="#00000"
                height={20}
                width={20}
              />
            </Typography>
          ) : (
            <>
              {searchText !== "" && (
                <>
                  {isStartSearch && (
                    <Typography component="div" className="account-result">
                      {resultList.length > 0 ? (
                        <>
                          {resultList.map((acc, index) => {
                            return (
                              <Typography
                                className={classNames(`account-item`, {
                                  focus: index === focusIndex,
                                })}
                                component="div"
                                onClick={() => accessUserProfile(resultList)}
                                onMouseEnter={() =>
                                  handleChangeFocusIndexByMove(index)
                                }
                                ref={
                                  index === resultList.length - 1
                                    ? scrollRef
                                    : null
                                }
                              >
                                <img src={acc.avatar} />
                                <Typography
                                  className="account-name"
                                  component="div"
                                >
                                  <Typography
                                    className="username"
                                    component="div"
                                  >
                                    {acc.username}
                                  </Typography>
                                  <Typography
                                    className="fullname"
                                    component="div"
                                  >
                                    {acc.fullName}
                                  </Typography>
                                </Typography>
                              </Typography>
                            );
                          })}
                          {!fetchInfo.last && !isLocalLoading && (
                            <Typography
                              className="view-more"
                              onClick={handleViewMore}
                            >
                              {trans('navbar.viewMore')}
                            </Typography>
                          )}
                          {isLocalLoading && (
                            <ReactLoading
                              className="loading-icon"
                              type="spokes"
                              color="#00000"
                              height={20}
                              width={20}
                            />
                          )}
                        </>
                      ) : (
                        <Typography className="no-data" align="center">
                          {trans("navbar.noData")}
                        </Typography>
                      )}
                    </Typography>
                  )}
                </>
              )}
              {showRecentSearch && recentSearchList.length > 0 && (
                <Typography component="div" className="account-result">
                  <Typography component="div" className="recent-header">
                    <Typography className="recent">{trans("navbar.recent")}</Typography>
                    <Typography
                      className="clear-all"
                      onClick={() => setShowClearModal(true)}
                    >
                      {trans("navbar.clearAll")}
                    </Typography>
                  </Typography>
                  {recentSearchList.map((item, index) => {
                    return (
                      <Typography
                        className={classNames(`account-item`, {
                          focus: index === focusIndex,
                        })}
                        component="div"
                        onClick={() => accessUserProfile(recentSearchList)}
                        onMouseEnter={() => handleChangeFocusIndexByMove(index)}
                      >
                        <img src={item.avatar} />
                        <Typography className="account-name" component="div">
                          <Typography className="username" component="div">
                            {item.username}
                          </Typography>
                          <Typography className="fullname" component="div">
                            {item.fullName}
                          </Typography>
                        </Typography>
                        <Typography component="div" className="delete-btn">
                          <CloseIcon
                            className="delete-icon"
                            onClick={(event) =>
                              handleDeleteRecentSearchItem(item, event)
                            }
                          />
                        </Typography>
                      </Typography>
                    );
                  })}
                </Typography>
              )}{" "}
            </>
          )}
        </Typography>
      </ClickAwayListener>
      <CustomModal
        isRadius
        width={400}
        height={250}
        open={showClearModal}
        handleCloseModal={() => setShowClearModal(false)}
      >
        <Typography component="div" className="clear-all-modal-container">
          <Typography component="div" className="header">
            {trans('navbar.questionHeader')}
          </Typography>
          <Typography component="div" className="warning">
            {trans('navbar.questionWarning')}
          </Typography>
          <Typography component="div" className="action-btns">
            <Button className="clear-all-btn" onClick={handleClearAll}>
              {trans('navbar.clearAll')}
            </Button>
            <Button
              className="not-now-btn"
              onClick={() => setShowClearModal(false)}
            >
              {" "}
              {trans("navbar.notNow")}
            </Button>
          </Typography>
        </Typography>
      </CustomModal>
    </>
  );
};

export default AppSearchInput;
