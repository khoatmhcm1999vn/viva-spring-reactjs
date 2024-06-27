import { Color, FontVariant } from "./constants";
const mainColor = "#0095f6";
const defaultColor = '#949494';
export const config = {
  palette: {
    [Color.AccentPrimary]: mainColor,
    [Color.AccentPrimaryHover]: mainColor,
    [Color.AccentPrimaryActive]: mainColor,
    [Color.Warning]: mainColor,
    [Color.TextSecondary]: defaultColor,
  },
  typography: {
    font: {
      [FontVariant.ButtonMd]: {
        fontSize: "16px !important",
        textTransform: "uppercase",
        borderRadius: "30px !important",
        fontWeight: "500 !important",
      },
    },
    fontFamily: '"Roboto","Helvetica","Arial",sans-serif !important',
  },
};
