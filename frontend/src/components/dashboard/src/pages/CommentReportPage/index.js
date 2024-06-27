import {
  getListCommentReport,
  rejectedCommentReport,
  approvedCommentReport,
} from "api/reportService";
import { useState, useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import moment from "moment";
import CustomModal from "../../../../common/CustomModal";
import Pagination from "@mui/material/Pagination";
import { limitPerPage, reportContent } from "../../../../../constant/types";

import useSnackbar from "hooks/useSnackbar";

import ConfirmDialog from "components/common/ConfirmDialog";
import PostReportModal from "components/dashboard/src/components/PostReportModal";
import ReportTable from "components/dashboard/src/components/ReportTable";
import { Typography } from "@mui/material";
import ReportHeader from "components/dashboard/src/components/ReportHeader";
import { useTranslation } from "react-i18next";
import ChangeReportType from "../../components/ChangeReportType";
import ReportPartiesInfo from "../../components/ReportPartiesInfo";

export default function CommentReportPage() {
  const [showCommentReportModal, setShowCommentReportModal] = useState({
    open: false,
    index: -1,
    item: {},
    dataList: [],
    reportMessage: "",
    reportId: -1,
  });

  const [commentReportList, setCommentReportList] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [reportType, setReportType] = useState("request");

  const handleChangeReportType = (value) => {
    setReportType(value);
  };

  const [openConfirmRejectedDialog, setOpenConfirmRejectedDialog] = useState({
    open: false,
    id: -1,
  });
  const [openConfirmApprovedDialog, setOpenConfirmApprovedDialog] = useState({
    open: false,
    id: -1,
  });

  const [reportDetailContent, setReportDetailContent] = useState("");

  const { setSnackbarState } = useSnackbar();
  const { t: trans } = useTranslation();

  useEffect(() => {
    fetchListCommentReport(page, limit);
  }, [page]);

  useEffect(() => {
    if (page === 1) {
      fetchListCommentReport(1, limit);
    } else {
      setPage(1);
    }
  }, [limit]);

  useEffect(() => {
    if (page === 1) {
      fetchListCommentReport(1, limit);
    } else {
      setPage(1);
    }
    setPage(1);
  }, [reportType]);

  const fetchListCommentReport = (page, limit) => {
    getListCommentReport({
      _sort: null,
      limit,
      _order: null,
      page: page - 1,
      isActive: reportType === "request",
    })
      .then((res) => setCommentReportList(res?.data))
      .finally(() => {});
  };

  const handleOpenReportModal = (
    index,
    item,
    dataList,
    reportMessage,
    reportId
  ) => {
    setShowCommentReportModal({
      open: true,
      index,
      item,
      dataList,
      reportMessage,
      reportId,
    });
  };

  const handleCloseReportModal = () => {
    setShowCommentReportModal({
      open: false,
      index: -1,
      dataLength: 0,
    });
  };

  const handleRejectedCommentReport = (id) => {
    handleCloseReportModal();
    rejectedCommentReport(id).then((res) => {
      if (res.status === 200) {
        setSnackbarState({
          open: true,
          content: `You have rejected a comment report successfully`,
          type: "SUCCESS",
        });
        updateReportListAfterDeleting(id);
      }
    });
  };

  const handleApprovedCommentReport = (id) => {
    handleCloseReportModal();
    approvedCommentReport(id).then((res) => {
      if (res.status === 200) {
        setSnackbarState({
          open: true,
          content: `You have approved a comment report successfully`,
          type: "SUCCESS",
        });
        updateReportListAfterDeleting(id);
      }
    });
  };

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  useEffect(() => {
    if (showCommentReportModal.reportMessage) {
      const filterReportDetail = trans(
        reportContent.filter(
          (item) => item.content === showCommentReportModal.reportMessage
        )[0].detailContent
      ).split("\n");
      const plainText = filterReportDetail.reduce((prev, curr) => {
        if (prev === "") {
          return " - " + curr;
        }
        return prev + "\n\n" + " - " + curr;
      }, "");
      setReportDetailContent(plainText);
    }
  }, [showCommentReportModal]);

  const handleOpenConfirmDialog = (type, id) => {
    if (type === "Approved") {
      setOpenConfirmApprovedDialog({
        open: true,
        id,
      });
    }
    if (type === "Rejected") {
      setOpenConfirmRejectedDialog({
        open: true,
        id,
      });
    }
  };

  const getOpenDialog = (type) => {
    if (type === "Approved") {
      return openConfirmApprovedDialog;
    }
    if (type === "Rejected") {
      return openConfirmRejectedDialog;
    }
  };

  const handleCloseDialog = (type) => {
    if (type === "Approved") {
      setOpenConfirmApprovedDialog({
        open: false,
        id: -1,
      });
    }
    if (type === "Rejected") {
      setOpenConfirmRejectedDialog({
        open: false,
        id: -1,
      });
    }
  };
  const handleConfirmDialog = (type, id) => {
    if (type === "Approved") {
      setOpenConfirmApprovedDialog({
        open: false,
        id: -1,
      });
      handleApprovedCommentReport(id);
    }
    if (type === "Rejected") {
      setOpenConfirmRejectedDialog({
        open: false,
        id: -1,
      });
      handleRejectedCommentReport(id);
    }
  };

  const updateReportListAfterDeleting = (id) => {
    if (commentReportList.content?.length === 1 && page > 1) {
      setPage(page - 1);
    } else {
      const filteredReportList = [...commentReportList.content].filter(
        (rp) => rp.id !== id
      );

      setCommentReportList({
        ...commentReportList,
        content: filteredReportList,
      });
    }
  };

  const headers = [
    {
      displayName: "Comment Report ID",
      align: "center",
      field: "id",
    },
    {
      displayName: "Content",
      align: "left",
      field: "content",
    },
    {
      displayName: "Sensitive Type",
      align: "left",
      field: "sentitiveType",
    },
    {
      displayName: "Date",
      align: "left",
      field: "createdAt",
    },
    {
      displayName: "User Name",
      align: "left",
      multiField: true,
      field: "createdBy.username",
    },
    {
      displayName: "Comment Content",
      align: "left",
      multiField: true,
      multiLanguage: true,
      field: "comment.content",
    },
  ];

  return (
    <div className="Table">
      <ChangeReportType
        handleChangeReportType={handleChangeReportType}
        reportType={reportType}
      />
      <h3>Comment Report Data</h3>
      <select onChange={(event) => setLimit(+event.target.value)}>
        {limitPerPage.map((item, index) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <ReportTable
        reportList={commentReportList}
        page={page}
        handleChangePage={handleChangePage}
        handleCloseDialog={handleCloseDialog}
        handleConfirmDialog={handleConfirmDialog}
        getOpenDialog={getOpenDialog}
        handleOpenReportModal={handleOpenReportModal}
        headers={headers}
      />

      <CustomModal
        open={showCommentReportModal.open}
        title=""
        handleCloseModal={handleCloseReportModal}
        width={1500}
        height={800}
      >
        <Typography component="div" className="report-admin-modal">
          <ReportHeader
            handleApprove={() =>
              handleOpenConfirmDialog(
                "Approved",
                showCommentReportModal.reportId
              )
            }
            handleReject={() =>
              handleOpenConfirmDialog(
                "Rejected",
                showCommentReportModal.reportId
              )
            }
            handleCancel={() => handleCloseReportModal()}
            reportMessage={trans(showCommentReportModal.reportMessage)}
            reportDetailContent={reportDetailContent}
            isDone={reportType === "done"}
          />
          <Typography component="div" className="report-total-space">
            <ReportPartiesInfo
              item={showCommentReportModal.item}
              reportName="Comment"
              reportType={reportType}
            />
            <PostReportModal
              title={showCommentReportModal.reportMessage}
              index={showCommentReportModal.index}
              dataList={showCommentReportModal.dataList}
              reportId={showCommentReportModal.reportId}
              setUpdatedItem={() => null}
              type="comment"
            />
          </Typography>
        </Typography>
      </CustomModal>
    </div>
  );
}
