import {
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { changeSetting } from "api/settingService";
import { pushNotificationsFields } from "constant/data";
import { useState, useEffect } from "react";
import "./style.scss";

const PushNotificationsPage = (props) => {
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
    <Typography component="div" className="push-noti-container">
      {pushNotificationsFields.map((item) => (
        <FormControl className="field-checkbox-container">
          <FormLabel id={item.field}>{item.title}</FormLabel>
          <RadioGroup
            aria-labelledby={item.field}
            defaultValue={
              globalSetting.filter((setting) => setting.type === item.type)[0]
                .value === '"true"' || "true"
                ? "on"
                : "off"
            }
            name="radio-buttons-group"
          >
            <FormControlLabel
              value="on"
              control={<Radio />}
              label="On"
              onClick={() =>
                handleChangePushNotificationSetting(item.type, "true")
              }
            />
            <FormControlLabel
              value="off"
              control={<Radio />}
              label="Off"
              onClick={() =>
                handleChangePushNotificationSetting(item.type, "false")
              }
            />
          </RadioGroup>
        </FormControl>
      ))}
    </Typography>
  );
};

export default PushNotificationsPage;
