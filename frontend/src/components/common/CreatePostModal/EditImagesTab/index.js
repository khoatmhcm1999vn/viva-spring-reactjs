import React, { useState } from "react";
import FilerobotImageEditor from "react-filerobot-image-editor";
import ImagesCarousel from "components/common/CreatePostModal/ImagesCarousel";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Button, Typography } from "@mui/material";
import b64toBlob from "b64-to-blob";
import "./style.scss";
import classNames from "classnames";
import { config } from "./config/main";
import { random } from "lodash";
import { useTranslation } from "react-i18next";

const EditImagesTab = (props) => {
  const {
    pictures,
    handleRemoveImage,
    handleSaveImages,
    handleEditedUpdateImage,
  } = props;
  const [currentImage, setCurrentImage] = useState({
    src: pictures.length > 0 ? pictures[0].src : "",
    index: 0,
  });
  const [openImages, setOpenImages] = useState(false);
  const [isSave, setIsSave] = useState(false);

  const { t: trans } = useTranslation();

  const blobToFile = (blobUrl, fileName): File => {
    const blob = new File([blobUrl], fileName, {
      lastModifiedDate: Date.now(),
      type: "image/png",
    });
    return blob;
  };
  const handleSelectImage = (img, index) => {
    setCurrentImage({ src: img.src, index });
  };

  const handleOpenImages = () => {
    setOpenImages(!openImages);
  };

  const handleSaveImage = (editedImageObject, designState) => {
    setIsSave(true);
    const newBlob = b64toBlob(
      editedImageObject.imageBase64.replace(/^[^,]+,/, ""),
      "image/png"
    );
    const newImageFile: File = blobToFile(
      newBlob,
      `${new Date()}-${random(0, 99)}.png`
    );
    const newImageSrc = URL.createObjectURL(newImageFile);
    handleEditedUpdateImage(newImageSrc, newImageFile, currentImage.index);
    setCurrentImage({ ...currentImage, src: newImageSrc, file: newImageFile });
    setIsSave(false);
  };

  const handleRemoveImageAtIndex = (img, indexOfDeleted) => {
    if (pictures.length > 1) {
      const { index } = currentImage;
      if (index > indexOfDeleted) {
        setCurrentImage({ ...currentImage, index: index - 1 });
      }
      if (index === indexOfDeleted) {
        if (index === 0) {
          setCurrentImage({ src: pictures[1].src, index: 0 });
        } else {
          setCurrentImage({ src: pictures[index - 1].src, index: index - 1 });
        }
      }
    }
    handleRemoveImage(img);
  };

  const renderEditor = () => {
    if (pictures.length > 0 && isSave === false) {
      return (
        <Typography component="div" className="edit-image-container">
          {pictures.length > 0 && (
            <FilerobotImageEditor
              theme={config}
              show={true}
              source={currentImage.src || ""}
              onSave={handleSaveImage}
              Text={{ placeholder: `${trans("createPost.text")}...` }}
            />
          )}
        </Typography>
      );
    }
  };

  const openClass = classNames({
    isOpen: openImages,
    isClose: !openImages,
  });

  return (
    <>
      {renderEditor()}
      <Typography
        component="div"
        className={`chosen-image-container ${openClass}`}
        align="left"
      >
        <Typography
          component="div"
          className="chose-image-switch"
          align="right"
        >
          <Button className={`btn-show-images`} onClick={handleOpenImages}>
            <KeyboardArrowUpIcon className={`show-images-icon ${openClass}`} />
          </Button>
        </Typography>
        <Typography component="div" className={`chosen-image-carousel `}>
          <ImagesCarousel
            pictures={pictures}
            handleRemoveImage={handleRemoveImageAtIndex}
            handleSaveImages={handleSaveImages}
            handleSelectImage={handleSelectImage}
            selectedImage={currentImage}
          />
        </Typography>{" "}
      </Typography>{" "}
    </>
  );
};

export default EditImagesTab;
