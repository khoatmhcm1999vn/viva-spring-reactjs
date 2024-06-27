import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { CookiesProvider, Cookies } from "react-cookie";

import i18n from "./translation/i18n";
import { I18nextProvider } from "react-i18next";
import { SocketStoreProvider } from "globalSocketState";

ReactDOM.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <CookiesProvider>
        <SocketStoreProvider>
          <BrowserRouter>
            <App cookie={Cookies} />
          </BrowserRouter>
        </SocketStoreProvider>
      </CookiesProvider>
    </I18nextProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
