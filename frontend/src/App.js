import "./App.scss";
import { useState, createContext, useEffect } from "react";
import Navbar from "components/common/Navbar";
import RouterList from "routes/routes";
import { InitLoading, ProgressLoading } from "components/common/Loading";
import { Dialog, DialogTitle } from "@mui/material";
import {
  getJwtToken,
  getRefreshToken,
  removeJwtToken,
  removeRefreshToken,
} from "utils/cookie";
import { getCurrentUser } from "utils/jwtToken";
import classNames from "classnames";
import { useCookies } from "react-cookie";
import NotificationSnackbar from "components/common/NotificationSnackbar";
import Footer from "components/common/Footer";
import useSocket from "hooks/useSocket";
import NotificationAlert from "components/common/NotificationAlert";
import { useHistory } from "react-router-dom";
import i18n from "translation/i18n";

export const AuthUser = createContext();
export const Loading = createContext();
export const Snackbar = createContext();
export const UpdateProfile = createContext();

function App() {
  const [openApp, setOpenApp] = useState(false);
  const [auth, setAuth] = useState({
    isLogin: false,
    isAdmin: true,
  });
  const [loading, setLoading] = useState(false);
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    title: "",
    content: "",
    type: "SUCCESS",
  });
  const [isExpiredToken, setIsExpiredToken] = useState(false);
  const [cookies, setCookie] = useCookies(["jwt-token", "refresh-token"]);
  const [isUpdateProfile, setIsUpdateProfile] = useState(false);
  const history = useHistory();

  const { handlers, states } = useSocket();
  const { connect, cleanSocketState } = handlers;

  const readCookie = () => {
    const token = getJwtToken();
    const refreshToken = getRefreshToken();
    if (token && refreshToken) {
      if (getCurrentUser().roles.includes("ADMIN")) {
        return {
          isLogin: true,
          isAdmin: true,
          isSuperAdmin: false,
        };
      } else if (getCurrentUser().roles.includes("SUPER_ADMIN")) {
        return {
          isLogin: true,
          isAdmin: true,
          isSuperAdmin: true,
        };
      } else {
        return {
          isLogin: true,
          isAdmin: false,
        };
      }
    } else {
      return {
        isLogin: false,
        isAdmin: false,
      };
    }
  };

  useEffect(() => {
    i18n.changeLanguage("en");
    connect();
    setAuth(readCookie());
    history.listen((e) => {
      cleanSocketState();
    });
  }, []);

  useEffect(() => {
    if (auth && Object.keys(cookies).length === 0) {
      setLoading(false);
      setIsExpiredToken(true);
    }
  }, [cookies]);

  setTimeout(() => {
    setOpenApp(true);
  }, 1000);

  useEffect(() => {
    if (snackbarState.open) {
      setTimeout(() => {
        setSnackbarState({
          open: false,
          title: "",
          content: "",
        });
      }, 4000);
    }
  }, [snackbarState.open]);

  const appWidthClass = classNames("page-content", {
    fullWidth: !auth.isLogin,
    notFullWidth: auth.isLogin && !auth.isAdmin,
    notFullWidthAdmin: auth.isLogin && auth.isAdmin,
  });
  return (
    <AuthUser.Provider value={{ auth, setAuth }}>
      <UpdateProfile.Provider value={{ isUpdateProfile, setIsUpdateProfile }}>
        <Loading.Provider value={{ loading, setLoading }}>
          <Snackbar.Provider value={{ snackbarState, setSnackbarState }}>
            <div className="App">
              {openApp ? (
                <>
                  {auth.isLogin && !auth.isAdmin && (
                    <div className="navbar">
                      <Navbar />
                    </div>
                  )}
                  <div className={appWidthClass}>
                    <RouterList />
                  </div>
                  {loading && <ProgressLoading />}
                  <NotificationSnackbar snackbarState={snackbarState} />
                  {!auth.isAdmin && <Footer />}
                </>
              ) : (
                <InitLoading />
              )}
              <NotificationAlert />
            </div>{" "}
          </Snackbar.Provider>
        </Loading.Provider>
      </UpdateProfile.Provider>
    </AuthUser.Provider>
  );
}

export default App;
