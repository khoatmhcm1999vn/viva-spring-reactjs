import {
  InputBase,
  Typography,
  FormControl,
  InputLabel,
  Input,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Radio,
  RadioGroup,
} from "@mui/material";
import {
  changeProfileAvatar,
  editProfile,
  getCurrentUserInformation,
  getProfile,
  uploadImage,
} from "api/userService";
import { editProfileTextFields } from "constant/data";
import useSnackbar from "hooks/useSnackbar";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getCurrentUser, updateCookieToken } from "utils/jwtToken";
import ReactLoading from "react-loading";
import "./style.scss";

const EditProfilePage = () => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [changeAvatarLoading, setChangeAvatarLoading] = useState(false);
  const [changeProfileLoading, setChangeProfileLoading] = useState(false);

  const { setSnackbarState } = useSnackbar();
  const { t: trans } = useTranslation();

  const handleGetProfile = () => {
    getCurrentUserInformation()
      .then((res) => {
        if (res.status === 200) {
          setCurrentUser({ ...res.data, avatar: getCurrentUser().avatar });
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {});
  };

  const handleChangeUsername = (event, field) => {
    setCurrentUser({
      ...currentUser,
      [field]: event.target.value,
    });
  };

  const handleChangeGender = (gender) => {
    setCurrentUser({
      ...currentUser,
      gender,
    });
  };

  const handleSubmitForm = () => {
    setChangeProfileLoading(true);
    const { bio, email, fullName, gender, phoneNumber, username } = currentUser;
    editProfile({
      bio,
      email,
      fullName,
      gender,
      phoneNumber,
      username,
    })
      .then((res) => {
        if (res.status === 200) {
          setSnackbarState({
            open: true,
            content: "Change profile successfully",
            type: "SUCCESS",
          });
          updateCookieToken();
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setChangeProfileLoading(false);
      });
  };

  const handleChangeImg = (img) => {
    setChangeAvatarLoading(true);
    const data = new FormData();
    data.append("file", img);
    uploadImage(data)
      .then((res) => {
        if (res.status === 200) {
          changeProfileAvatar({
            actualName: res.data.actualName,
            uniqueName: res.data.uniqueName,
            url: res.data.url,
          }).then((res) => {
            if (res.status === 200) {
              setSnackbarState({
                open: true,
                content: trans("profile.changeAvatarSuccessfully"),
                type: "SUCCESS",
              });
              setCurrentUser({ ...currentUser, avatar: res.data.url });
              updateCookieToken();
            }
          });
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setChangeAvatarLoading(false);
      });
  };

  useEffect(() => {
    handleGetProfile();
  }, []);

  return (
    <Typography
      component="div"
      align="center"
      className="edit-profile-container"
    >
      <Typography component="div" align="center" className="user-mini-info">
        <Typography className="avatar">
          {" "}
          <img src={currentUser.avatar} />
          {changeAvatarLoading && (
            <ReactLoading
              className="change-avatar-loading"
              type="spokes"
              color="#00000"
              height={20}
              width={20}
            />
          )}
        </Typography>
        <Typography className="right-action">
          <Typography className="username">
            {getCurrentUser().username}
          </Typography>

          <Typography className="change-profile-photo">
            <>
              {" "}
              <input
                className="change-profile-avatar"
                type="file"
                id="change-avatar"
                name="avatar"
                required
                onChange={(e) => handleChangeImg(e.target.files[0])}
              />
              <label for="change-avatar" className="change-user-avatar-btn">
                Change Profile Photo
              </label>
            </>
          </Typography>
        </Typography>
      </Typography>

      {editProfileTextFields.map((item) => {
        return (
          <Typography component="div" className="field-container">
            <Typography className="field-title">{item.title}</Typography>

            <Typography component="div" className="field-content">
              {item.type === "textField" ? (
                <TextField
                  id={item.field}
                  type="text"
                  variant="outlined"
                  className="field-input-text"
                  maxRows={item.maxRow}
                  multiline={true}
                  value={currentUser[item.field]}
                  onChange={(e) => handleChangeUsername(e, item.field)}
                />
              ) : (
                <FormControl className="field-checkbox-container">
                  <RadioGroup
                    aria-labelledby={item.field}
                    defaultValue={currentUser.gender}
                    name="radio-buttons-group"
                    className="radio-group"
                  >
                    <FormControlLabel
                      value="MALE"
                      control={<Radio />}
                      label="Male"
                      onClick={() => handleChangeGender("MALE")}
                    />
                    <FormControlLabel
                      value="FEMALE"
                      control={<Radio />}
                      label="Female"
                      onClick={() => handleChangeGender("FEMALE")}
                    />
                    <FormControlLabel
                      value="OTHER"
                      control={<Radio />}
                      label="Other"
                      onClick={() => handleChangeGender("OTHER")}
                    />
                  </RadioGroup>
                </FormControl>
              )}
              <Typography component="div" className="below-text">
                {item.belowText}
              </Typography>
            </Typography>
          </Typography>
        );
      })}
      <Button className="submit-btn" onClick={handleSubmitForm}>
        {changeProfileLoading ? (
          <ReactLoading
            className="change-profile-loading"
            type="spokes"
            color="#00000"
            height={20}
            width={20}
          />
        ) : (
          "Submit"
        )}
      </Button>
    </Typography>
  );
};

export default EditProfilePage;
