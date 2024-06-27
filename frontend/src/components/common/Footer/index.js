import { useState, useEffect } from "react";
import SimpleReactFooter from "simple-react-footer";
import i18n from "translation/i18n";
import { getCurrentLanguage } from "translation/util";
import { useTranslation } from "react-i18next";
import "./style.scss";

const Footer = () => {
  const { t: trans } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };
  const columns = [
    {
      title: `${trans("footer.resources")}`,
      resources: [
        {
          name: `${trans("footer.about")}`,
          link: "/about",
        },
        {
          name: `${trans("footer.careers")}`,
          link: "/careers",
        },
        {
          name: `${trans("footer.contact")}`,
          link: "/contact",
        },
        {
          name: `${trans("footer.admin")}`,
          link: "/admin",
        },
      ],
    },
    {
      title: `${trans("footer.legal")}`,
      resources: [
        {
          name: `${trans("footer.privacy")}`,
          link: "/privacy",
        },
        {
          name: `${trans("footer.terms")}`,
          link: "/terms",
        },
      ],
    },
    // {
    //   title: "Language",
    //   resources: [
    //     {
    //       name: (
    //         <div className="d-flex align-items-center">
    //           <select
    //             onChange={changeLanguage}
    //             onClick={(e) => e.preventDefault()}
    //           >
    //             <option value="vi">Vietnamese</option>
    //             <option value="en" selected="selected">
    //               English
    //             </option>
    //           </select>
    //         </div>
    //       ),
    //       // link: "",
    //     },
    //   ],
    // },
  ];

  return (
    <>
      <SimpleReactFooter
        columns={columns}
        pinterest="fluffy_cats_collections"
        copyright="Vivacon"
        iconColor="darkgrey"
        backgroundColor="transparent"
        fontColor="darkgrey"
        copyrightColor="darkgrey"
      />
    </>
  );
};

export default Footer;
