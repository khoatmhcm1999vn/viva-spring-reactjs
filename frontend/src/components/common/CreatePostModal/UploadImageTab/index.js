import { Typography } from "@mui/material";
import ImageUploader from "react-images-upload";
import "./style.scss";
import { useTranslation } from "react-i18next";

const UploadImageTab = (props) => {
  const { handleSaveImages } = props;

  const { t: trans } = useTranslation();

  return (
    <Typography className="upload-image-tab-container" component="div">
      <Typography className="upload-image" component="div">
        <ImageUploader
          withIcon={false}
          withPreview={true}
          label=""
          buttonText={
            <>
              {" "}
              <img
                src={require("images/upload-image.png")}
                width="140px"
                height="140px"
                className="upload-image-icon"
                alt=""
              />
            </>
          }
          onChange={handleSaveImages}
          imgExtension={[".jpg", ".gif", ".png", ".gif", ".svg"]}
          maxFileSize={10485760000000}
          fileSizeError=" file size is too big"
        />
        <Typography className="select-image-txt">
          {trans("createPost.selectImage")}
        </Typography>
      </Typography>
    </Typography>
  );
};

export default UploadImageTab;
