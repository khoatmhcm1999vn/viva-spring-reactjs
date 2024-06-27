import { Route, Navigate, Routes, BrowserRouter, Link } from "react-router-dom";
import PostsListPage from "components/pages/PostsListPage";
import NotFoundPage from "components/pages/NotFoundPage";
import LoginPage from "components/pages/LoginPage";
import ProfilePage from "components/pages/ProfilePage";
import { useContext } from "react";
import { AuthUser } from "App";
import { Switch } from "react-router-dom";
import { Redirect } from "react-router-dom";
import RegisterPage from "components/pages/RegisterPage";
import VerifyPage from "components/pages/VerifyPage";
import FindAccountPage from "components/pages/FindAccountPage";
import ForgotPasswordPage from "components/pages/ForgotPasswordPage";
import Dashboard from "components/dashboard/src";
import PostReportPage from "components/dashboard/src/pages/PostReportPage";
import ChatPage from "components/pages/ChatPage";
import SettingPage from "components/pages/SettingPage";
import PostDetailPage from "components/pages/PostDetailPage";
import HashtagPage from "components/pages/HashtagPage";

const RouterList = () => {
  const Auth = useContext(AuthUser);
  return (
    <Switch>
      {!Auth.auth.isLogin && (
        <>
          <Route exact path="/login" component={LoginPage} />
          <Route exact path="/register" component={RegisterPage} />
          <Route exact path="/verify" component={VerifyPage} />
          <Route exact path="/find-account" component={FindAccountPage} />
          <Route exact path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="*">
            <Redirect push to="/login" replace />
          </Route>
        </>
      )}
      {Auth.auth.isLogin && !Auth.auth.isAdmin && (
        <>
          <PrivateRoute exact path="/login" component={LoginPage} />
          <PrivateRoute exact path="/" component={PostsListPage} />
          <PrivateRoute
            exact
            path="/profile/:username"
            component={ProfilePage}
          />
          <PrivateRoute exact path="/report" component={PostReportPage} />
          <PrivateRoute exact path="/chat" component={ChatPage} />
          <PrivateRoute exact path="/setting" component={SettingPage} />
          <PrivateRoute exact path="/post/:id" component={PostDetailPage} />
          <PrivateRoute exact path="/hashtag/:name" component={HashtagPage} />
          <PrivateRoute exact path="/not-found" component={NotFoundPage} />
        </>
      )}
      {Auth.auth.isLogin && Auth.auth.isAdmin && (
        <>
          <PrivateRoute exact path="/login" component={LoginPage} />
          <PrivateRoute exact path="/dashboard" component={Dashboard} />
          <PrivateRoute exact path="/not-found" component={NotFoundPage} />
        </>
      )}
    </Switch>
  );
};

const PrivateRoute = ({ component: Component, ...rest }) => {
  const Auth = useContext(AuthUser);
  if (Component.name === "LoginPage") {
    return (
      <Route
        {...rest}
        render={({ location }) =>
          !Auth.auth.isLogin ? (
            <Component location={location} />
          ) : (
            <Redirect
              to={{
                pathname: Auth.auth.isAdmin ? "/dashboard" : "/",
                // state: { from: location },
              }}
            />
          )
        }
      />
    );
  } else {
    return (
      <Route
        {...rest}
        render={({ location }) =>
          Auth.auth.isLogin ? (
            <Component />
          ) : (
            <Redirect
              to={{
                pathname: "/login",
                // state: { from: location },
              }}
            />
          )
        }
      />
    );
  }
};

export default RouterList;
