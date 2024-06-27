import {
  getListAccountReport,
  rejectedAccountReport,
  approvedAccountReport,
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
import { limitPerPage } from "../../../../../constant/types";
import useSnackbar from "hooks/useSnackbar";

import ConfirmDialog from "components/common/ConfirmDialog";
import AccountReportModal from "components/dashboard/src/components/AccountReportModal";
import { Typography, Button, Tooltip, IconButton } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { reportContent } from "constant/types";
import "./style.scss";
import ReportTable from "components/dashboard/src/components/ReportTable";
import ReportHeader from "components/dashboard/src/components/ReportHeader";
import { useTranslation } from "react-i18next";
import ChangeReportType from "../../components/ChangeReportType";
import ReportPartiesInfo from "../../components/ReportPartiesInfo";

export default function AccountReportPage() {
  const [showAccountReportModal, setShowAccountReportModal] = useState({
    open: false,
    index: -1,
    item: {},
    dataList: [],
    reportMessage: "",
  });

  const [accountReportList, setAccountReportList] = useState([]);
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
    fetchListAccountReport(page, limit);
  }, [page]);

  useEffect(() => {
    if (page === 1) {
      fetchListAccountReport(1, limit);
    } else {
      setPage(1);
    }
  }, [limit]);

  useEffect(() => {
    if (page === 1) {
      fetchListAccountReport(1, limit);
    } else {
      setPage(1);
    }
    setPage(1);
  }, [reportType]);

  const fetchListAccountReport = (page, limit) => {
    getListAccountReport({
      _sort: null,
      limit,
      _order: null,
      page: page - 1,
      isActive: reportType === "request",
    })
      .then((res) => setAccountReportList(res?.data))
      .finally(() => {});
  };

  const handleOpenAccountReportModal = (
    index,
    item,
    dataList,
    reportMessage
  ) => {
    setShowAccountReportModal({
      open: true,
      index,
      item,
      dataList,
      reportMessage,
    });
  };

  const handleCloseAccountReportModal = () => {
    setShowAccountReportModal({
      open: false,
      index: -1,
      dataLength: 0,
    });
  };

  const handleRejectedAccountReport = (id) => {
    handleCloseAccountReportModal();
    rejectedAccountReport(id).then((res) => {
      if (res.status === 200) {
        setSnackbarState({
          open: true,
          content: `You have rejected a account report successfully`,
          type: "SUCCESS",
        });
        updateReportListAfterDeleting(id);
      }
    });
  };

  const handleApprovedAccountReport = (id) => {
    handleCloseAccountReportModal();
    approvedAccountReport(id).then((res) => {
      if (res.status === 200) {
        setSnackbarState({
          open: true,
          content: `You have approved a account report successfully`,
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
    if (showAccountReportModal.reportMessage) {
      const filterReportDetail = trans(
        reportContent.filter(
          (item) => item.content === showAccountReportModal.reportMessage
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
  }, [showAccountReportModal]);

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
      handleApprovedAccountReport(id);
    }
    if (type === "Rejected") {
      setOpenConfirmRejectedDialog({
        open: false,
        id: -1,
      });
      handleRejectedAccountReport(id);
    }
  };

  const updateReportListAfterDeleting = (id) => {
    if (accountReportList.content?.length === 1 && page > 1) {
      setPage(page - 1);
    } else {
      const filteredReportList = [...accountReportList.content].filter(
        (rp) => rp.id !== id
      );
      setAccountReportList({
        ...accountReportList,
        content: filteredReportList,
      });
    }
  };

  const headers = [
    {
      displayName: "Account Report ID",
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
      field: "account.username",
    },
    {
      displayName: "Account Content",
      align: "left",
      multiField: true,
      field: "account.bio",
    },
  ];

  return (
    <div className="Table">
      <ChangeReportType
        handleChangeReportType={handleChangeReportType}
        reportType={reportType}
      />
      <h3>Account Report Data</h3>
      <select onChange={(event) => setLimit(+event.target.value)}>
        {limitPerPage.map((item, index) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <ReportTable
        reportList={accountReportList}
        page={page}
        handleChangePage={handleChangePage}
        handleCloseDialog={handleCloseDialog}
        handleConfirmDialog={handleConfirmDialog}
        getOpenDialog={getOpenDialog}
        handleOpenReportModal={handleOpenAccountReportModal}
        headers={headers}
      />

      <CustomModal
        open={showAccountReportModal.open}
        title=""
        handleCloseModal={handleCloseAccountReportModal}
        width={1500}
        height={800}
      >
        <Typography component="div" className="report-admin-modal">
          <ReportHeader
            handleApprove={() =>
              handleOpenConfirmDialog(
                "Approved",
                showAccountReportModal.item.id
              )
            }
            handleReject={() =>
              handleOpenConfirmDialog(
                "Rejected",
                showAccountReportModal.item.id
              )
            }
            handleCancel={() => handleCloseAccountReportModal()}
            reportMessage={trans(showAccountReportModal.reportMessage)}
            reportDetailContent={reportDetailContent}
            isDone={reportType === "done"}
          />
          <Typography component="div" className="report-total-space">
            <ReportPartiesInfo
              item={showAccountReportModal.item}
              reportName="Account"
              reportType={reportType}
            />
            <div style={{ overflow: "auto", height: 'calc(800px - 60px)', margin: 'auto' }}>
              <AccountReportModal
                title={showAccountReportModal.reportMessage}
                index={showAccountReportModal.index}
                dataList={showAccountReportModal.dataList}
                item={showAccountReportModal.item}
                setUpdatedItem={() => null}
              />
            </div>
          </Typography>
        </Typography>
      </CustomModal>
    </div>
  );
}
