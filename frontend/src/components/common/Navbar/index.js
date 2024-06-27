import React, { useState, useEffect, useContext } from "react";
import {
  AppBar,
  Button,
  Typography,
  ClickAwayListener,
  Box,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import "./style.scss";
import { getCurrentUser } from "utils/jwtToken";
import AppButtonsGroup from "components/common/AppButtonsGroup";
import UserOption from "components/common/UserOption";
import CreatePostModal from "components/common/CreatePostModal";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthUser } from "App";
import AppSearchInput from "../AppSearchInput";
import i18n from "translation/i18n";
import useSocket from "hooks/useSocket";
import { getCurrentLanguage } from "translation/util";
import { Icon } from "@iconify/react";
import LanguageIcon from "@mui/icons-material/Language";
import moment from "moment/min/moment-with-locales";

const Navbar = () => {
  const [openUserOption, setUserOption] = useState(false);
  const [openCreatePostModal, setOpenCreatePostModal] = useState(false);
  const [language, setLanguage] = useState("en");

  const history = useHistory();
  const Auth = useContext(AuthUser);

  const handleClickAwayUserOption = () => {
    setUserOption(false);
  };
  const handleOpenUserOption = () => {
    setUserOption(!openUserOption);
  };

  const handleOpenCreatePostModal = () => {
    setOpenCreatePostModal(true);
  };

  const handleCloseOpenCreatePostModal = () => {
    setOpenCreatePostModal(false);
  };

  const changeLanguage = (e) => {
    setLanguage(e.target.value);
    i18n.changeLanguage(e.target.value);
  };

  useEffect(() => {
    getCurrentLanguage();
  }, [language]);

  useEffect(() => {
    moment().locale(language)
    console.log(moment().localeData())
  }, [language])

  return (
    <AppBar className="nav-container" postion="sticky">
      <Typography
        className="app-logo"
        align="center"
        onClick={() => history.push("/")}
      >
        VivaCon
      </Typography>

      {!Auth.auth.isAdmin && (
        <>
          <FormControl
            sx={{ m: 1, minWidth: 120, border: "none" }}
            className="change-language-container"
          >
            <Select
              value={language}
              onChange={changeLanguage}
              displayEmpty
              inputProps={{ "aria-label": "Without label" }}
              defaultValue="en"
              id="demo-simple-select-autowidth"
              IconComponent={() => (
                <LanguageIcon width={80} height={80} className="icon" />
              )}
            >
              <MenuItem value={"en"}>En</MenuItem>
              <MenuItem value={"vi"}>Vi</MenuItem>
            </Select>
          </FormControl>
          <>
            <AppSearchInput />
            <AppButtonsGroup
              handleOpenCreatePostModal={handleOpenCreatePostModal}
            />
          </>
        </>
      )}
      <Typography className="app-user" component="div" align="center">
        <ClickAwayListener onClickAway={handleClickAwayUserOption}>
          <Box sx={{ position: "relative" }}>
            <Typography
              className="profile-avatar"
              onClick={handleOpenUserOption}
            >
              <Typography
                className="user-avatar"
                component="div"
                align="center"
              >
                <img
                  src={getCurrentUser().avatar}
                  width="45"
                  height="45"
                  alt=""
                />
              </Typography>
            </Typography>
            {openUserOption && (
              <UserOption handleClose={() => setUserOption(false)} />
            )}
          </Box>
        </ClickAwayListener>
      </Typography>
      <CreatePostModal
        open={openCreatePostModal}
        handleClose={handleCloseOpenCreatePostModal}
      />
    </AppBar>
  );
};

export default Navbar;
