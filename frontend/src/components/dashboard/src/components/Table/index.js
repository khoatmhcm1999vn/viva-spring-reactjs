import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import moment from "moment";
import { convertUTCtoLocalDate } from "utils/calcDateTime";

import "./style.scss";

const makeStyle = (status) => {
  const commentStyle = {
    borderRadius: "20px",
    fontWeight: 900,
    padding: "5px 10px",
  };
  if (status) {
    return {
      ...commentStyle,
      background: "rgba(49, 162, 76, 0.7)",
      boxShadow: "rgb(49, 162, 76, 0.7) 0px 1.5px 3px 0px",
      color: "white",
    };
  } else {
    return {
      ...commentStyle,
      background: "rgb(237, 236, 236, 0.7)",
      boxShadow: "rgba(237, 236, 236, 0.7) 0px 1.5px 3px 0px",
      color: "white",
    };
  }
};

export default function BasicTable({ newestPostData }) {
  return (
    <div className="Table">
      <h3>Latest Post</h3>
      <TableContainer
        component={Paper}
        style={{ boxShadow: "0px 13px 20px 0px #80808029" }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="left">Post ID</TableCell>
              <TableCell align="left">Caption</TableCell>
              <TableCell align="left">User Name</TableCell>
              {/* <TableCell align="left">Image</TableCell> */}
              <TableCell align="left">Status</TableCell>
              <TableCell align="left">Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody style={{ color: "white" }}>
            {newestPostData.map((row) => (
              <TableRow
                key={row.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell align="left">{row.id}</TableCell>
                <TableCell component="th" scope="row">
                  {row.caption}
                </TableCell>
                <TableCell align="left">{row.userName}</TableCell>
                {/* <TableCell align="left">
                  <img className="" src={row.url} alt="Idea" />
                  {row.url}
                </TableCell> */}
                <TableCell align="left">
                  <span className="status" style={makeStyle(row.active)}>
                    {row.active ? "Active" : "Unactive"}
                  </span>
                </TableCell>
                <TableCell align="left" className="left">
                  {convertUTCtoLocalDate(row.createdAt, "YYYY-MM-DD HH:mm:ss")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
