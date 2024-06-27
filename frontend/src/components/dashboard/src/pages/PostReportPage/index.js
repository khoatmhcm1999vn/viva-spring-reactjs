import {
  getListPostReport,
  rejectedPostReport,
  approvedPostReport,
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
import PostDetailsModal from "components/common/PostDetailsModal";
import Pagination from "@mui/material/Pagination";
import { limitPerPage, reportContent } from "../../../../../constant/types";
import useSnackbar from "hooks/useSnackbar";

import ConfirmDialog from "components/common/ConfirmDialog";
import { convertUTCtoLocalDate } from "utils/calcDateTime";
import ReportTable from "components/dashboard/src/components/ReportTable";
import {
  IconButton,
  Tooltip,
  Typography,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import "./style.scss";
import PostReportModal from "components/dashboard/src/components/PostReportModal";
import ReportHeader from "components/dashboard/src/components/ReportHeader";
import { useTranslation } from "react-i18next";
import ChangeReportType from "../../components/ChangeReportType";
import ReportPartiesInfo from "../../components/ReportPartiesInfo";

export default function PostReportPage() {
  const [showPostReportModal, setShowPostReportModal] = useState({
    open: false,
    index: -1,
    item: {},
    dataList: [],
    reportMessage: "",
    reportId: -1,
  });

  const [postReportList, setPostReportList] = useState([]);
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
    console.log("refetch");
    fetchListPostReport(page, limit);
  }, [page]);

  useEffect(() => {
    if (page === 1) {
      fetchListPostReport(1, limit);
    } else {
      setPage(1);
    }
  }, [limit]);

  useEffect(() => {
    if (page === 1) {
      fetchListPostReport(1, limit);
    } else {
      setPage(1);
    }
    setPage(1);
  }, [reportType]);

  useEffect(() => {
    if (showPostReportModal.reportMessage) {
      const filterReportDetail = trans(
        reportContent.filter(
          (item) => item.content === showPostReportModal.reportMessage
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
  }, [showPostReportModal]);

  const fetchListPostReport = (page, limit) => {
    getListPostReport({
      _sort: null,
      limit,
      _order: null,
      page: page - 1,
      isActive: reportType === "request",
    })
      .then((res) => setPostReportList(res?.data))
      .finally(() => {});
  };

  const handleOpenPostReportModal = (
    index,
    item,
    dataList,
    reportMessage,
    reportId
  ) => {
    setShowPostReportModal({
      open: true,
      index,
      item,
      dataList,
      reportMessage,
      reportId,
    });
  };

  const handleClosePostReportModal = () => {
    setShowPostReportModal({
      open: false,
      index: -1,
      dataLength: 0,
    });
  };

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
      handleApprovedPostReport(id);
    }
    if (type === "Rejected") {
      setOpenConfirmRejectedDialog({
        open: false,
        id: -1,
      });
      handleRejectedPostReport(id);
    }
  };

  const updateReportListAfterDeleting = (id) => {
    if (postReportList.content?.length === 1 && page > 1) {
      setPage(page - 1);
    } else {
      const filteredReportList = [...postReportList.content].filter(
        (rp) => rp.id !== id
      );
      setPostReportList({
        ...postReportList,
        content: filteredReportList,
      });
    }
  };

  const handleRejectedPostReport = (id) => {
    handleClosePostReportModal();
    rejectedPostReport(id).then((res) => {
      if (res.status === 200) {
        setSnackbarState({
          open: true,
          content: `You have rejected a post report successfully`,
          type: "SUCCESS",
        });
        updateReportListAfterDeleting(id);
      }
      if (postReportList && postReportList?.content.length === 1) {
        fetchListPostReport(page - 1, limit);
        setPage(page - 1);
      } else {
        fetchListPostReport(page, limit);
      }
    });
  };

  const handleApprovedPostReport = (id) => {
    handleClosePostReportModal();
    approvedPostReport(id).then((res) => {
      if (res.status === 200) {
        setSnackbarState({
          open: true,
          content: `You have approved a post report successfully`,
          type: "SUCCESS",
        });
        updateReportListAfterDeleting(id);
      }
      if (postReportList && postReportList?.content.length === 1) {
        fetchListPostReport(page - 1, limit);
        setPage(page - 1);
      } else {
        fetchListPostReport(page, limit);
      }
    });
  };

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  const headers = [
    {
      displayName: "Post Report ID",
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
      displayName: "Post Content",
      align: "left",
      multiField: true,
      field: "post.caption",
    },
  ];

  return (
    <div className="Table">
      <ChangeReportType
        handleChangeReportType={handleChangeReportType}
        reportType={reportType}
      />
      <h3>Post Report Data</h3>
      <select onChange={(event) => setLimit(+event.target.value)}>
        {limitPerPage.map((item, index) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <ReportTable
        reportList={postReportList}
        headers={headers}
        page={page}
        handleChangePage={handleChangePage}
        handleCloseDialog={handleCloseDialog}
        handleConfirmDialog={handleConfirmDialog}
        getOpenDialog={getOpenDialog}
        handleOpenReportModal={handleOpenPostReportModal}
      />

      <CustomModal
        open={showPostReportModal.open}
        title=""
        handleCloseModal={handleClosePostReportModal}
        width={1500}
        height={800}
      >
        <Typography component="div" className="report-admin-modal">
          <ReportHeader
            handleApprove={() =>
              handleOpenConfirmDialog("Approved", showPostReportModal.reportId)
            }
            handleReject={() =>
              handleOpenConfirmDialog("Rejected", showPostReportModal.reportId)
            }
            handleCancel={() => handleClosePostReportModal()}
            reportMessage={trans(showPostReportModal.reportMessage)}
            reportDetailContent={reportDetailContent}
            isDone={reportType === "done"}
          />
          <Typography component="div" className="report-total-space">
            <ReportPartiesInfo item={showPostReportModal.item} reportName="Post" reportType={reportType}/>
            <PostReportModal
              title={showPostReportModal.reportMessage}
              index={showPostReportModal.index}
              dataList={showPostReportModal.dataList}
              reportId={showPostReportModal.reportId}
              setUpdatedItem={() => null}
              type="post"
            />
          </Typography>
        </Typography>
      </CustomModal>
    </div>
  );
}
