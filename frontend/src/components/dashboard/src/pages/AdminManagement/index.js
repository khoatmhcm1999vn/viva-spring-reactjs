import {
  Checkbox,
  FormControlLabel,
  InputAdornment,
  OutlinedInput,
  Pagination,
  Typography,
  Button,
} from "@mui/material";
import { useEffect, useState } from "react";
import { createNewAdmin, getAllAdmins, deleteAdmin } from "api/adminService";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useTranslation } from "react-i18next";
import { convertUTCtoLocalDate } from "utils/calcDateTime";
import {
  StyledTableCell,
  StyledTableRow,
} from "components/dashboard/src/components/StyledTable";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import "./style.scss";
import CustomModal from "components/common/CustomModal";
import { createNewAdminFields } from "constant/data";
import ValidConditionTextField from "components/common/ValidConditionTextField";
import {
  checkAllCondition,
  getStrongScore,
  handleCheckValidEmail,
} from "utils/checkValidInput";
import ReactLoading from "react-loading";
import useSnackbar from "hooks/useSnackbar";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ConfirmDialog from "components/common/ConfirmDialog";

const AdminManagement = () => {
  const [pageNumber, setPageNumber] = useState(0);
  const [adminList, setAdminList] = useState([]);
  const [fetchInfo, setFetchInfo] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState({
    open: false,
    title: "",
    content: "",
    user: {
      id: "",
      username: "",
    },
  });

  const [inputData, setInputData] = useState({
    email: "",
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  let err = {
    email: "",
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
  };
  const [invalidMessage, setInvalidMessage] = useState({
    email: "",
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [openCondition, setOpenCondition] = useState(false);

  const { t: trans } = useTranslation();
  const { setSnackbarState } = useSnackbar();

  const resetInvalidMessage = (field) => {
    err = {
      ...invalidMessage,
      [field]: "",
    };
    setInvalidMessage(err);
  };

  const handleChangeTextField = (field, textInput) => {
    setInputData({ ...inputData, [field]: textInput.target.value });
    if (invalidMessage[field] !== "") {
      resetInvalidMessage(field);
    }
  };

  const checkTextField = () => {
    let invaliObject = { ...err };
    Object.keys(inputData).map((key, value) => {
      if (inputData[key] === "") {
        const displayName = createNewAdminFields.filter(
          (item) => item.field === key
        )[0].title;
        invaliObject = {
          ...invaliObject,
          [key]: `${displayName} is required`,
        };
      }
    });
    err = { ...invaliObject };
    setInvalidMessage(invaliObject);
  };

  const checkConfirmPassword = () => {
    const { confirmPassword, password } = inputData;
    if (confirmPassword !== "" && password !== "") {
      if (confirmPassword !== password) {
        err = {
          ...err,
          confirmPassword: "Confirm password is different from password.",
        };
        setInvalidMessage(err);
      } else {
        err = {
          ...err,
          confirmPassword: "",
        };
        setInvalidMessage(err);
        handleCheckStrongPassword();
      }
    }
  };

  const handleCheckStrongPassword = () => {
    if (!checkAllCondition(inputData.password)) {
      err = {
        ...err,
        password: "Password must be strong.",
      };
      setInvalidMessage(err);
    }
  };

  const checkEmail = () => {
    if (!handleCheckValidEmail(inputData.email) && inputData.email !== "") {
      err = {
        ...err,
        email: "Email is unavailable.",
      };
      setInvalidMessage(err);
    }
  };

  const handleCheck = () => {
    checkTextField();
    checkEmail();
    checkConfirmPassword();
    if (canBeCreateNewAdmin()) {
      hanldeCreateNewAdmin();
    }
  };

  const canBeCreateNewAdmin = () => {
    let isAccepted = true;
    Object.values(err).map((value) => {
      if (value !== "") {
        isAccepted = false;
      }
    });
    return isAccepted;
  };

  const handleToggleCondtion = (field) => {
    if (field === "password") {
      setOpenCondition(!openCondition);
    }
  };

  const hanldeCreateNewAdmin = () => {
    setLoading(true);
    createNewAdmin({
      ...inputData,
    })
      .then((res) => {
        if (res.status === 200) {
          setTimeout(() => {
            setSnackbarState({
              open: true,
              content: "Create new admin successfully",
              type: "SUCCESS",
            });
            setOpenCreate(false);
            if (pageNumber > 0) {
              setPageNumber(0);
            } else {
              handleGetAllAdmins();
            }
          }, 1000);
        }
      })
      .catch((err) => {
        setTimeout(() => {
          setSnackbarState({
            open: true,
            content: "Some information is existed on system",
            type: "FAIL",
          });
        }, 1000);
      })
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      });
  };

  const handleGetAllAdmins = () => {
    setLoading(true);
    getAllAdmins({
      limit: 5,
      _sort: "id",
      _order: "desc",
      page: pageNumber,
    })
      .then((res) => {
        if (res.status === 200) {
          setAdminList(res.data.content);
          setFetchInfo(res.data);
        }
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => {
    handleGetAllAdmins();
  }, [pageNumber]);

  const handleChangePage = (event, value) => {
    setPageNumber(value - 1);
  };

  const handleDeleteAdmin = (id, username) => {
    deleteAdmin(id)
      .then((res) => {
        if (res.status === 200) {
          setTimeout(() => {
            setSnackbarState({
              open: true,
              content: `Delete admin @${username} successfully.`,
              type: "SUCCESS",
            });
          }, 1000);
          setOpenConfirmDelete({
            open: false,
            title: "",
            content: "",
            user: {
              id: "",
              username: "",
            },
          });
          if (pageNumber > 0) {
            setPageNumber(0);
          } else {
            handleGetAllAdmins();
          }
        }
      })
      .catch((err) => {
        setTimeout(() => {
          setSnackbarState({
            open: true,
            content: `Something went wrong.`,
            type: "FAIL",
          });
        }, 1000);
      });
  };

  const handleOpenConfirmDelete = (id, username) => {
    setOpenConfirmDelete({
      open: true,
      title: "Confirm to delete admin",
      content: `Are you sure to delete admin @${username}`,
      user: {
        id,
        username,
      },
    });
  };

  const handleCloseConfirmDelete = () => {
    setOpenConfirmDelete({
      open: false,
      title: "",
      content: "",
      user: {
        id: "",
        username: "",
      },
    });
  };

  const handleConfirmDetele = () => {
    handleDeleteAdmin(
      openConfirmDelete.user.id,
      openConfirmDelete.user.username
    );
  };

  const headers = [
    {
      displayName: "Admin ID",
      align: "center",
      field: "id",
    },
    {
      displayName: "Email",
      align: "left",
      field: "email",
    },
    {
      displayName: "Username",
      align: "left",
      field: "username",
    },
    {
      displayName: "Full name",
      align: "left",
      field: "fullName",
    },
    {
      displayName: "Created at",
      align: "left",
      field: "createdAt",
    },
    {
      displayName: "Gender",
      align: "center",
      field: "gender",
    },
    {
      displayName: "Phone number",
      align: "left",
      field: "phoneNumber",
    },
    {
      displayName: "",
      align: "center",
      field: "customField",
      customElement: <DeleteOutlinedIcon className="delete-admin" />,
      handleOnClick: handleOpenConfirmDelete,
    },
  ];

  const handleOpenCreateAdminModal = () => {
    err = {
      email: "",
      fullName: "",
      username: "",
      password: "",
      confirmPassword: "",
    };
    setInvalidMessage(err);
    setInputData(err);
    setOpenCreate(true);
  };

  const renderCreateNewAdminModal = () => {
    return (
      <>
        {createNewAdminFields.map((item, index) => {
          return (
            <Typography component="div" className="field-container">
              <Typography className="field-title">{item.title}</Typography>

              <Typography component="div" className="field-content">
                {item.type === "textField" && (
                  <>
                    <Typography id={item.field} className="field-item">
                      <OutlinedInput
                        error={invalidMessage[item.field] !== ""}
                        id={item.field}
                        type={item.isPassword ? "password" : "text"}
                        className="field-input-text"
                        value={inputData[item.field]}
                        onChange={(e) => handleChangeTextField(item.field, e)}
                        onFocus={() => handleToggleCondtion(item.field)}
                        onBlur={() => handleToggleCondtion(item.field)}
                        endAdornment={
                          <InputAdornment position="start">
                            {item.field === "password" &&
                              inputData[item.field] !== "" && (
                                <Typography className="password-score">
                                  {getStrongScore(inputData[item.field])}
                                </Typography>
                              )}
                          </InputAdornment>
                        }
                      />
                      {openCondition && item.field === "password" && (
                        <ValidConditionTextField
                          textInput={inputData[item.field]}
                        />
                      )}
                    </Typography>
                    {invalidMessage[item.field] !== "" && (
                      <Typography className="error-textfield">
                        {invalidMessage[item.field]}
                      </Typography>
                    )}
                  </>
                )}
              </Typography>
            </Typography>
          );
        })}
        <Button className="submit-btn" onClick={handleCheck}>
          {isLoading ? (
            <ReactLoading
              className="loading-icon"
              type="spokes"
              color="#00000"
              height={16}
              width={16}
            />
          ) : (
            "Create"
          )}
        </Button>
      </>
    );
  };

  return (
    <>
      <Typography component="div" className="admin-management">
        <div className="admin-management-header">
          <h3>Admin Management</h3>
          <div className="create-new-btn" onClick={handleOpenCreateAdminModal}>
            <p> Create new</p>
            <AddCircleOutlineIcon />
          </div>
        </div>
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
              {adminList
                ? adminList.map((row, index) => (
                    <>
                      <StyledTableRow
                        key={row.id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        {headers.map((header) => {
                          if (header.field === "customField") {
                            return (
                              <StyledTableCell
                                component="th"
                                scope="row"
                                align={header.align}
                                onClick={() =>
                                  header.handleOnClick(row.id, row.username)
                                }
                              >
                                {header.customElement}
                              </StyledTableCell>
                            );
                          }
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
                                  row[headers[4].field],
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
          </Table>
        </TableContainer>
        <Pagination
          count={fetchInfo?.totalPages}
          color="primary"
          page={pageNumber + 1}
          onChange={handleChangePage}
        />
      </Typography>
      <CustomModal
        isRadius={false}
        width={500}
        height={500}
        open={openCreate}
        title="Create new Admin"
        handleCloseModal={() => setOpenCreate(false)}
      >
        <Typography component="div" className="create-admin-modal-container">
          {renderCreateNewAdminModal()}
        </Typography>
      </CustomModal>
      <ConfirmDialog
        handleClose={handleCloseConfirmDelete}
        handleConfirm={handleConfirmDetele}
        open={openConfirmDelete.open}
        title={openConfirmDelete.title}
        description={openConfirmDelete.content}
      />
    </>
  );
};

export default AdminManagement;
