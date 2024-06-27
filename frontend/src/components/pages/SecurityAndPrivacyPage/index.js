import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Typography,
  FormLabel,
} from "@mui/material";
import { changeSetting } from "api/settingService";
import {
  emailNotificationFields,
  securityAndPrivacyFields,
} from "constant/data";
import { useState, useEffect } from "react";
import "./style.scss";

const SecurityAndPrivacyPage = (props) => {
  const { globalSetting, updateSetting } = props;
  const handleChangePushNotificationSetting = (type, value) => {
    const currentSettingOfType = globalSetting.filter(
      (setting) => setting.type === type
    )[0].value;
    if (currentSettingOfType !== value) {
      changeSetting({
        settingType: type,
        value,
      }).then((res) => {
        if (res.status === 200) {
          updateSetting();
        }
      });
    }
  };
  return (
    <Typography component="div" className="privacy-security-container">
      <Typography component="div" className="privacy-security-title">
        Subsribe to:
      </Typography>
      {securityAndPrivacyFields.map((item) => (
        <FormControl className="field-checkbox-container">
          <FormControlLabel
            control={
              <Checkbox
                defaultChecked={
                  globalSetting.filter(
                    (setting) => setting.type === item.type
                  )[0].value === "true" ||
                  globalSetting.filter(
                    (setting) => setting.type === item.type
                  )[0].value === '"true"'
                }
                onChange={(e) =>
                  handleChangePushNotificationSetting(
                    item.type,
                    e.target.checked.toString()
                  )
                }
              />
            }
            label={item.title}
            className="checkbox-title"
          />
          <Typography className="checkbox-text">{item.checkBoxText}</Typography>
        </FormControl>
      ))}
    </Typography>
  );
};

export default SecurityAndPrivacyPage;
