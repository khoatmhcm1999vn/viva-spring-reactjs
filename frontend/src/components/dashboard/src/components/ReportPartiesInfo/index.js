import { Typography } from "@mui/material";
import { convertDateTimeOnNearest } from "utils/calcDateTime";
import "./style.scss";
import _ from "lodash";

const ReportPartiesInfo = ({ item, reportName, reportType }) => {
  const {
    id: reportId,
    lastModifiedBy: adminInfo,
    createdBy: reportOwnerInfo,
    createdAt: reportCreatedAt,
    lastModifiedAt: resolvedAt,
    post,
    comment,
    account,
  } = item;
  if (reportName !== "Account") {
    const { createdBy: targetInfo, createdAt: targetCreatedAt } =
      post || comment;
    return (
      <Typography component="div" className="report-parties-info">
        <Typography component="div" className="report-parties-id">
          <h3> Report ID: {reportId}</h3>
        </Typography>

        <Typography component="div" className="report-parties-time">
          <Typography component="div" className="details">
            <Typography component="div" className="report-created-at">
              Report created at:{" "}
              <strong>{convertDateTimeOnNearest(reportCreatedAt)}</strong>
            </Typography>
            {reportType === "done" && (
              <Typography component="div" className="report-created-at">
                Report resolved at:{" "}
                <strong>{convertDateTimeOnNearest(resolvedAt)}</strong>
              </Typography>
            )}
            <Typography component="div" className="report-created-at">
              {reportName} created at:{" "}
              <strong>{convertDateTimeOnNearest(targetCreatedAt)}</strong>
            </Typography>
          </Typography>
        </Typography>

        <Typography component="div" className="report-parties-owner">
          <Typography component="div" className="title">
            Report owner:
          </Typography>
          <Typography component="div" className="details">
            <Typography component="div" className="username">
              Username: <strong>{reportOwnerInfo.username}</strong>
            </Typography>
            <Typography component="div" className="fullName">
              Full name: <strong>{reportOwnerInfo.fullName}</strong>
            </Typography>
            <Typography component="div" className="email">
              Email: <strong>{reportOwnerInfo.email}</strong>
            </Typography>
          </Typography>
        </Typography>

        <Typography component="div" className="report-parties-target">
          <Typography component="div" className="title">
            User's {_.lowerCase(reportName)}:
          </Typography>
          <Typography component="div" className="details">
            <Typography component="div" className="username">
              Username: <strong>{targetInfo?.username}</strong>
            </Typography>
            <Typography component="div" className="fullName">
              Full name: <strong>{targetInfo?.fullName}</strong>
            </Typography>
            <Typography component="div" className="email">
              Email: <strong>{targetInfo.email}</strong>
            </Typography>
          </Typography>
        </Typography>
        {reportType === "done" && (
          <Typography component="div" className="report-parties-admin">
            <Typography component="div" className="title">
              Resolved by:
            </Typography>
            <Typography component="div" className="details">
              <Typography component="div" className="username">
                Username: <strong>{adminInfo?.username}</strong>
              </Typography>
              <Typography component="div" className="fullName">
                Full name: <strong>{adminInfo.fullName}</strong>
              </Typography>
              <Typography component="div" className="email">
                Email: <strong>{adminInfo.email}</strong>
              </Typography>
            </Typography>
          </Typography>
        )}
      </Typography>
    );
  } else {
    const { createdAt: targetCreatedAt } = account;
    const targetInfo = { ...account };
    return (
      <Typography component="div" className="report-parties-info">
        <Typography component="div" className="report-parties-id">
          <h3> Report ID: {reportId}</h3>
        </Typography>

        <Typography component="div" className="report-parties-time">
          <Typography component="div" className="details">
            <Typography component="div" className="report-created-at">
              Report created at:{" "}
              <strong>{convertDateTimeOnNearest(reportCreatedAt)}</strong>
            </Typography>
            {reportType === "done" && (
              <Typography component="div" className="report-created-at">
                Report resolved at:{" "}
                <strong>{convertDateTimeOnNearest(resolvedAt)}</strong>
              </Typography>
            )}
            <Typography component="div" className="report-created-at">
              {reportName} created at:{" "}
              <strong>{convertDateTimeOnNearest(targetCreatedAt)}</strong>
            </Typography>
          </Typography>
        </Typography>

        <Typography component="div" className="report-parties-owner">
          <Typography component="div" className="title">
            Report owner:
          </Typography>
          <Typography component="div" className="details">
            <Typography component="div" className="username">
              Username: <strong>{reportOwnerInfo.username}</strong>
            </Typography>
            <Typography component="div" className="fullName">
              Full name: <strong>{reportOwnerInfo.fullName}</strong>
            </Typography>
            <Typography component="div" className="email">
              Email: <strong>{reportOwnerInfo.email}</strong>
            </Typography>
          </Typography>
        </Typography>

        <Typography component="div" className="report-parties-target">
          <Typography component="div" className="title">
            User's {_.lowerCase(reportName)}:
          </Typography>
          <Typography component="div" className="details">
            <Typography component="div" className="username">
              Username: <strong>{targetInfo?.username}</strong>
            </Typography>
            <Typography component="div" className="fullName">
              Full name: <strong>{targetInfo?.fullName}</strong>
            </Typography>
            <Typography component="div" className="email">
              Email: <strong>{targetInfo.email}</strong>
            </Typography>
          </Typography>
        </Typography>
        {reportType === "done" && (
          <Typography component="div" className="report-parties-admin">
            <Typography component="div" className="title">
              Resolved by:
            </Typography>
            <Typography component="div" className="details">
              <Typography component="div" className="username">
                Username: <strong>{adminInfo?.username}</strong>
              </Typography>
              <Typography component="div" className="fullName">
                Full name: <strong>{adminInfo.fullName}</strong>
              </Typography>
              <Typography component="div" className="email">
                Email: <strong>{adminInfo.email}</strong>
              </Typography>
            </Typography>
          </Typography>
        )}
      </Typography>
    );
  }
};

export default ReportPartiesInfo;
