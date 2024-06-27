import moment from "moment/min/moment-with-locales";
import { getCurrentLanguage } from "translation/util";
import i18n from "translation/i18n";

const offset = new Date().getTimezoneOffset();
const locale = i18n.language;
moment.locale(locale);
moment().locale(locale);

export const calculateFromNow = (dateTime) => {
  const locale = i18n.language;
  moment.locale(locale);
  return moment(new Date(dateTime).getTime()).fromNow();
};

export const convertUTCtoLocalDate = (date, format) => {
  const convertedDate = moment(date)
    .add(-offset, "minutes")
    .format(format || "YYYY-MM-DDTHH:mm:ss.SSSsss");
  return convertedDate;
};

export const convertDateTimeOnNearest = (date) => {
  const locale = i18n.language;
  moment.locale(locale);
  const convertedDate = moment(date).add(-offset, "minutes").calendar();
  return convertedDate
};
