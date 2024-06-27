import { useState, useEffect } from "react";
import { Typography, Button, InputBase } from "@mui/material";
import { useTranslation } from "react-i18next";
import { searchAccountsByKeyword } from "api/userService";
import "./style.scss";
import classNames from "classnames";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import CloseIcon from "@mui/icons-material/Close";
import ReactLoading from "react-loading";
import { getCurrentUser } from "utils/jwtToken";

const ChattingSearch = (props) => {
  const {handleNext, isShare = false} = props;
  const [searchText, setSearchText] = useState("");
  const [resultList, setResultList] = useState(
    JSON.parse(localStorage.getItem("suggested_users")) || []
  );
  const [isStartSearch, setStartSearch] = useState(false);
  const [selectedList, setSelectedList] = useState([]);
  const [isLocalLoading, setLocalLoading] = useState(false);
  const [firstLocalLoading, setFirstLocalLoading] = useState(false);
  const [fetchInfo, setFetchInfo] = useState({});
  const [pageNumber, setPageNumber] = useState(0);
  const [isNoData, setIsNoData] = useState(false);
  const { t: trans } = useTranslation();

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
      limit: 10,
    })
      .then((res) => {
        if (res.status === 200) {
          setFetchInfo(res.data);
          if (page === 0) {
            if (res.data.content.length === 0) {
              setIsNoData(true);
            }
            setResultList(res.data.content);
          } else {
            setResultList([...resultList, ...res.data.content]);
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

  const handleSelectUser = (user) => {
    if (selectedList.find((item) => item.username === user.username)) {
      const filtered = selectedList.filter((item) => item.username !== user.username);
      setSelectedList(filtered);
    } else {
      setSelectedList([user, ...selectedList]);
    }
  };

  const handleDeleteSelectedItem = (username) => {
    const filtered = selectedList.filter((item) => item.username !== username);
    setSelectedList(filtered);
  };

  const changeSearchText = (e) => {
    if (searchText === "") {
      setResultList([]);
    }
    if (e.target.value === "") {
      setResultList(JSON.parse(localStorage.getItem("suggested_users")) || []);
    }
    setIsNoData(false);
    setSearchText(e.target.value);
    setStartSearch(false);
  };

  const handleViewMore = () => {
    setPageNumber(pageNumber + 1);
    searchAccounts(pageNumber + 1);
  };

  useEffect(() => {
    if (searchText !== "") {
      setTimeout(() => {
        setStartSearch(true);
      }, 1000);
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

  const renderSelectedItems = () => {
    return (
      <Typography component="div" className="selected-tag-list">
        {selectedList.map((user) => {
          return (
            <Typography component="div" className="selected-tag">
              <Typography className="username">{user.username}</Typography>
              <CloseIcon
                className="delete-icon"
                onClick={() => handleDeleteSelectedItem(user.username)}
              />
            </Typography>
          );
        })}
      </Typography>
    );
  };

  return (
    <Typography component="div" className="chatting-search-container">
      {" "}
      <Typography component="div" className="title-container">
        <Typography className="title-name">New Message</Typography>
        <Button
          component="div"
          className="next-btn"
          disabled={selectedList.length === 0}
          onClick={() => handleNext(selectedList)}
        >
          {isShare ? `Share` : `Next`}
        </Button>
      </Typography>
      <Typography component="div" className="chatting-search-input">
        <Typography className="send-to">To: </Typography>
        <Typography component="div" className="send-to-users">
          {selectedList.length > 0 && renderSelectedItems()}
          <InputBase
            className="chatting-search-text"
            placeholder={`${trans("navbar.search")}...`}
            onChange={changeSearchText}
            value={searchText}
          />
        </Typography>
      </Typography>
      <Typography component="div" className="chatting-search-result">
        {searchText === "" && (
          <Typography className="suggested-label" align="left">
            Suggested
          </Typography>
        )}
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
            {resultList.map((item) => {
              return (
                <Typography
                  component="div"
                  className="search-result-item"
                  onClick={() => {
                    if (item.username !== getCurrentUser().username) {
                      handleSelectUser(item);
                    }
                  }}
                >
                  <img src={item.avatar} />
                  <Typography
                    className="account-name"
                    component="div"
                    align="left"
                  >
                    <Typography className="username" component="div">
                      {item.username}
                    </Typography>
                  </Typography>
                  {item.username !== getCurrentUser().username && (
                    <Typography component="div" className="check-btn">
                      {selectedList.find(
                        (selected) => selected.username === item.username
                      ) ? (
                        <RadioButtonCheckedIcon />
                      ) : (
                        <RadioButtonUncheckedIcon />
                      )}
                    </Typography>
                  )}
                </Typography>
              );
            })}
            {!fetchInfo.last &&
              !isLocalLoading &&
              resultList.length > 0 &&
              searchText !== "" && (
                <Typography className="view-more" onClick={handleViewMore}>
                  {trans("navbar.viewMore")}
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
            {isNoData && (
              <Typography className="no-data" align="center">
                {trans("navbar.noData")}
              </Typography>
            )}
          </>
        )}
      </Typography>
    </Typography>
  );
};

export default ChattingSearch;
