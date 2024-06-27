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
import CustomModal from "components/common/CustomModal";
import Pagination from "@mui/material/Pagination";
import { limitPerPage } from "constant/types";
import useSnackbar from "hooks/useSnackbar";
import "./style.scss";

import ConfirmDialog from "components/common/ConfirmDialog";
import { convertUTCtoLocalDate } from "utils/calcDateTime";
import { useTranslation } from "react-i18next";
import {
  StyledTableCell,
  StyledTableRow,
} from "components/dashboard/src/components/StyledTable";
import { Typography } from "@mui/material";

const ReportTable = ({
  reportList,
  handleConfirmDialog,
  handleCloseDialog,
  page,
  handleChangePage,
  getOpenDialog,
  handleOpenReportModal,
  headers,
}) => {
  const { t: trans } = useTranslation();
  return (
    <>
      <TableContainer
        component={Paper}
        style={{ boxShadow: "0px 13px 20px 0px #80808029" }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <StyledTableRow>
              {headers.map((header) => {
                return (
                  <StyledTableCell align={header.align}>
                    {header.displayName}
                  </StyledTableCell>
                );
              })}
            </StyledTableRow>
          </TableHead>
          <TableBody style={{ color: "white" }}>
            {reportList?.content
              ? reportList?.content.map((row, index) => (
                  <>
                    <ConfirmDialog
                      handleClose={() => handleCloseDialog("Rejected")}
                      handleConfirm={() =>
                        handleConfirmDialog(
                          "Rejected",
                          getOpenDialog("Rejected").id
                        )
                      }
                      open={getOpenDialog("Rejected").open}
                      title="Are you sure want to rejected this report?"
                      description="Report Content"
                    />
                    <ConfirmDialog
                      handleClose={() => handleCloseDialog("Approved")}
                      handleConfirm={() =>
                        handleConfirmDialog(
                          "Approved",
                          getOpenDialog("Approved").id
                        )
                      }
                      open={getOpenDialog("Approved").open}
                      title="Are you sure want to approved this report?"
                      description="Report Content"
                    />

                    <StyledTableRow
                      key={row.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      onClick={() =>
                        handleOpenReportModal(
                          index,
                          row,
                          reportList?.content,
                          row.content,
                          row.id
                        )
                      }
                    >
                      {headers.map((header) => {
                        if (header.field !== "createdAt") {
                          return (
                            <StyledTableCell
                              component="th"
                              scope="row"
                              align={header.align}
                            >
                              {!header.multiField
                                ? trans(row[header.field])
                                : trans(
                                    row[header.field.split(".")[0]][
                                      header.field.split(".")[1]
                                    ]
                                  )}
                            </StyledTableCell>
                          );
                        } else
                          return (
                            <StyledTableCell align={header.align}>
                              {convertUTCtoLocalDate(
                                row[headers[3].field],
                                "YYYY-MM-DD HH:mm:ss"
                              )}
                            </StyledTableCell>
                          );
                      })}
                    </StyledTableRow>
                  </>
                ))
              : null}
          </TableBody>
          {reportList.content?.length === 0 && (
            <Typography component="td" colSpan={100} className="no-data-table">No Data</Typography>
          )}
        </Table>
      </TableContainer>
      <Pagination
        count={reportList?.totalPages}
        color="primary"
        page={page}
        onChange={handleChangePage}
      />
    </>
  );
};

export default ReportTable;
