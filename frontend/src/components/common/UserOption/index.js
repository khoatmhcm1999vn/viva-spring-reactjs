import { useState } from "react";
import { CardContent, Typography, Card } from "@mui/material";
import { AuthUser } from "App";
import { userOption, adminOption } from "constant/data";
import { useContext } from "react";
import { useHistory } from "react-router-dom";
import { getCurrentUser } from "utils/jwtToken";
import "./style.scss";
import { useTranslation } from "react-i18next";
import { removeLocalStorageField } from "utils/cookie";

const UserOption = (props) => {
  const Auth = useContext(AuthUser);
  const history = useHistory();

  const { t: trans } = useTranslation();
  let filterUserOption;
  if (Auth.auth.isAdmin) {
    filterUserOption = adminOption;
  } else {
    filterUserOption = userOption;
  }
  return (
    <Typography
      component="div"
      className="user-option-container"
      style={{ "--optionSize": filterUserOption.length }}
    >
      <Card>
        <CardContent>
          {filterUserOption.map((option) => {
            return (
              <Typography
                component="div"
                className="user-option-item"
                onClick={() => {
                  option.onClickHandle();
                  if (option.name === "settingUI.logOut") {
                    removeLocalStorageField("suggested_users");
                    removeLocalStorageField("recent_search");
                    window.location.href = "/login";
                  } else {
                    if (option.name === "settingUI.profile") {
                      history.push(
                        `${option.navigateUrl}/${getCurrentUser().username}`
                      );
                    } else {
                      history.push(`${option.navigateUrl}`);
                    }
                    props.handleClose();
                  }
                }}
              >
                <Typography component="div" className="option-icon">
                  {option.icon}
                </Typography>
                <Typography component="div" className="option-name">
                  {trans(option.name)}
                </Typography>
              </Typography>
            );
          })}
        </CardContent>
      </Card>
    </Typography>
  );
};

export default UserOption;
