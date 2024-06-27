import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { removeJwtToken, removeRefreshToken } from "utils/cookie";
import { useNavigate } from "react-router-dom";
const notiType = {
  POST: "POST",
  FOLLOWED: "FOLLOWED",
  LIKED: "LIKED",
  COMMENTED: "COMMENTED",
};

export const notificationList = [
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Matt",
    type: notiType.POST,
    numberOfImages: 3,
    url: "/",
    seen: false,
    dateTime: new Date("2022-02-22T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Marry",
    type: notiType.LIKED,
    numberOfImages: null,
    url: "/",
    seen: false,
    dateTime: new Date("2022-01-12T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "John",
    type: notiType.LIKED,
    numberOfImages: null,
    url: "/",
    seen: true,
    dateTime: new Date("2022-01-12T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Marry",
    type: notiType.COMMENTED,
    numberOfImages: null,
    url: "/",
    seen: false,
    dateTime: new Date("2022-01-12T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Williams",
    type: notiType.POST,
    numberOfImages: 5,
    url: "/",
    seen: true,
    dateTime: new Date("2021-12-12T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Robert",
    type: notiType.POST,
    numberOfImages: 1,
    url: "/",
    seen: true,
    dateTime: new Date("2021-08-12T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Robert",
    type: notiType.POST,
    numberOfImages: 1,
    url: "/",
    seen: true,
    dateTime: new Date("2021-06-12T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Robert",
    type: notiType.POST,
    numberOfImages: 1,
    url: "/",
    seen: true,
    dateTime: new Date("2021-04-12T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Robert",
    type: notiType.POST,
    numberOfImages: 1,
    url: "/",
    seen: true,
    dateTime: new Date("2021-03-12T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Robert",
    type: notiType.POST,
    numberOfImages: 1,
    url: "/",
    seen: true,
    dateTime: new Date("2021-02-12T20:17:46.384Z"),
  },
];

export const messageList = [
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Matt",
    newestMessage: "Hello John!",
    isYourNewestMessage: false,
    url: "/",
    seen: false,
    dateTime: new Date("2022-02-22T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Marry",
    newestMessage: "Hello John!",
    isYourNewestMessage: false,
    url: "/",
    seen: false,
    dateTime: new Date("2022-02-22T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Williams",
    newestMessage: "Can you help me, John?",
    isYourNewestMessage: false,
    url: "/",
    seen: false,
    dateTime: new Date("2022-02-22T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Matt",
    newestMessage: "Bye!",
    isYourNewestMessage: true,
    url: "/",
    seen: true,
    dateTime: new Date("2022-02-22T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Matt",
    newestMessage: "Hello Matt!",
    isYourNewestMessage: true,
    url: "/",
    seen: true,
    dateTime: new Date("2022-02-22T20:17:46.384Z"),
  },
  {
    avatar: "images/fr-avatar.png",
    ownerName: "Matt",
    newestMessage: "Hello John!",
    isYourNewestMessage: false,
    url: "/",
    seen: true,
    dateTime: new Date("2022-02-22T20:17:46.384Z"),
  },
];

export const userOption = [
  {
    icon: <AccountCircleIcon />,
    name: "settingUI.profile",
    onClickHandle: () => null,
    navigateUrl: "/profile",
  },
  {
    icon: <SettingsIcon />,
    name: "settingUI.setting",
    onClickHandle: () => null,
    navigateUrl: "/setting",
  },
  {
    icon: <LogoutOutlinedIcon />,
    name: "settingUI.logOut",
    onClickHandle: () => {
      removeJwtToken();
      removeRefreshToken();
    },
    navigateUrl: "/login",
  },
];

export const adminOption = [
  {
    icon: <DashboardIcon />,
    name: "dashboard.dashboard",
    onClickHandle: () => null,
    navigateUrl: "/dashboard",
  },
  {
    icon: <LogoutOutlinedIcon />,
    name: "settingUI.logOut",
    onClickHandle: () => {
      removeJwtToken();
      removeRefreshToken();
    },
    navigateUrl: "/login",
  },
];

export const settingOption = [
  {
    label: "Edit Profile",
  },
  {
    label: "Change Password",
  },
  {
    label: "Email Notifications",
  },
  {
    label: "Push Notifications",
  },
  {
    label: "Privacy and Security",
  },
  {
    label: "Login Activity",
  },
];

export const editProfileTextFields = [
  {
    title: "Name",
    field: "fullName",
    belowText: `Help people discover your account by using the name you're known by: either your full name, nickname, or business name.`,
    type: "textField",
    maxRow: 1,
  },
  {
    title: "Username",
    field: "username",
    belowText: ``,
    type: "textField",
    maxRow: 1,
  },
  {
    title: "Bio",
    field: "bio",
    belowText: `Personal Information
    Provide your personal information, even if the account is used for a business, a pet or something else. This won't be a part of your public profile.`,
    type: "textField",
    maxRow: 3,
  },
  {
    title: "Email",
    field: "email",
    type: "textField",
    maxRow: 1,
  },
  {
    title: "Phone Number",
    field: "phoneNumber",
    type: "textField",
    maxRow: 1,
  },
  {
    title: "Gender",
    field: "gender",
    type: "checkBox",
    maxRow: 1,
  },
];

export const pushNotificationsFields = [
  {
    title: "Likes",
    field: "likes",
    type: "PUSH_NOTIFICATION_ON_LIKE",
  },
  {
    title: "Comments",
    field: "comments",
    type: "PUSH_NOTIFICATION_ON_COMMENT",
  },
  {
    title: "Follows",
    field: "follows",
    type: "PUSH_NOTIFICATION_ON_FOLLOWING",
  },
];

export const emailNotificationFields = [
  {
    title: "Report emails",
    field: "",
    checkBoxText: "Give report result that you reported.",
    type: "EMAIL_ON_REPORTING_RESULT",
  },
  {
    title: "Reminder emails",
    field: "",
    checkBoxText: "Give notification you may have missed.",
    type: "EMAIL_ON_MISSED_ACTIVITIES",
  },
];

export const securityAndPrivacyFields = [
  {
    title: "Privacy on active status",
    field: "",
    checkBoxText: "Show your online status.",
    type: "PRIVACY_ON_ACTIVE_STATUS",
  },
  {
    title: "Privacy on new device/location login activity",
    field: "",
    checkBoxText:
      "Warning and require the verified process when having abnormal login activity on new device.",
    type: "PRIVACY_ON_NEW_DEVICE_LOCATION",
  },
];

export const changePasswordFields = [
  {
    title: "Old password",
    field: "oldPassword",
    type: "textField",
    maxRow: 1,
  },
  {
    title: "New password",
    field: "newPassword",
    type: "textField",
    maxRow: 1,
  },
  {
    title: "Confirm new password",
    field: "confirmNewPassword",
    type: "textField",
    maxRow: 1,
  },
];

export const createNewAdminFields = [
  {
    title: "Email",
    field: "email",
    type: "textField",
    isPassword: false,
    maxRow: 1,
  },
  {
    title: "Full name",
    field: "fullName",
    type: "textField",
    isPassword: false,
    maxRow: 1,
  },
  {
    title: "Username",
    field: "username",
    type: "textField",
    isPassword: false,
    maxRow: 1,
  },
  {
    title: "Password",
    field: "password",
    type: "textField",
    isPassword: true,
    maxRow: 1,
  },
  {
    title: "Confirm password",
    field: "confirmPassword",
    type: "textField",
    isPassword: true,
    maxRow: 1,
  },
];
