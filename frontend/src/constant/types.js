import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import GroupIcon from "@mui/icons-material/Group";
import PermContactCalendarIcon from "@mui/icons-material/PermContactCalendar";

export const notificationType = {
  NOTIFICATION: "NOTIFICATION",
  MESSAGE: "MESSAGE",
};

export const privacyPostType = [
  {
    value: "PUBLIC",
    label: "privacy.public",
    icon: <PublicIcon />,
  },
  {
    value: "ONLY_ME",
    label: "privacy.onlyMe",
    icon: <LockIcon />,
  },
  {
    value: "FOLLOWER",
    label: "privacy.follower",
    icon: <PermContactCalendarIcon />,
  },
];

export const limitPerPage = [5, 10, 20, 30, 50];

export const reportContent = [
  {
    id: 1,
    sentitiveType: "NUDITY",
    content: "report.nudityContent",
    detailContent: "report.nudityDetailContent",
  },
  {
    id: 2,
    sentitiveType: "VIOLENCE",
    content: "report.violenceContent",
    detailContent: "report.violenceDetailContent",
  },
  {
    id: 3,
    sentitiveType: "SUICIDE",
    content: "report.suicideContent",
    detailContent: "report.suicideDetailContent",
  },
  {
    id: 4,
    sentitiveType: "TERRORISM",
    content: "report.terrorismContent",
    detailContent: "report.terrorismDetailContent",
  },
  {
    id: 5,
    sentitiveType: "SPAM",
    content: "report.spamContent",
    detailContent: "report.spamDetailContent",
  },
  {
    id: 6,
    sentitiveType: "OTHER",
    content: "report.otherContent",
    detailContent: "report.otherDetailContent",
  },
];

export const PERIOD = {
  MONTHS: "months",
  QUARTERS: "quarters",
  YEARS: "years",
};

export const chattingType = {
  TYPING: "TYPING",
  USUAL_TEXT: "USUAL_TEXT",
  NEW_PARTICIPANT: "NEW_PARTICIPANT",
};

export const notificationStatus = {
  SENT: "SENT",
  RECEIVED: "RECEIVED",
  SEEN: "SEEN",
};

export const notificationsType = {
  REPLY_ON_COMMENT: "REPLY_ON_COMMENT",

  COMMENT_ON_POST: "COMMENT_ON_POST",

  AWARE_ON_COMMENT: "AWARE_ON_COMMENT",

  LIKE_ON_POST: "LIKE_ON_POST",

  FOLLOWING_ON_ME: "FOLLOWING_ON_ME",

  POST_REPORT_APPROVING_ACTION_AUTHOR: "POST_REPORT_APPROVING_ACTION_AUTHOR",

  POST_REPORT_APPROVING_DOMAIN_AUTHOR: "POST_REPORT_APPROVING_DOMAIN_AUTHOR",

  COMMENT_REPORT_APPROVING_ACTION_AUTHOR:
    "COMMENT_REPORT_APPROVING_ACTION_AUTHOR",

  COMMENT_REPORT_APPROVING_DOMAIN_AUTHOR:
    "COMMENT_REPORT_APPROVING_DOMAIN_AUTHOR",

  ACCOUNT_REPORT_APPROVING_ACTION_AUTHOR:
    "ACCOUNT_REPORT_APPROVING_ACTION_AUTHOR",

  ACCOUNT_REPORT_APPROVING_DOMAIN_AUTHOR:
    "ACCOUNT_REPORT_APPROVING_DOMAIN_AUTHOR",
};

export const maliciousImageType = {
  DRUGS: "Recreational drugs",
  WEAPON: "Weapons such as guns, rifles and firearms",
  NUDITY: "Explicit and partial nudity",
  GORE: "Gore, horrific imagery, content with blood",
};
