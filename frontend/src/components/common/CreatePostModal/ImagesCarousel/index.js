import { Typography } from "@mui/material";
import ImageUploader from "react-images-upload";
import Carousel from "react-elastic-carousel";
import "./style.scss";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import classNames from "classnames";

const ImagesCarousel = (props) => {
  const {
    pictures,
    handleRemoveImage,
    handleSaveImages,
    handleSelectImage = () => {},
    selectedImage = {src: '', index: -1},
  } = props;

  const breakPoints = [
    { width: 1, itemsToShow: 1 },
    { width: 520, itemsToShow: 3, itemsToScroll: 2 },
  ];

  return (
    <Typography component="div" className="list-images-container">
      <Carousel breakPoints={breakPoints}>
        {pictures.map((img, index) => {
          return (
            <Typography
              component="div"
              className={classNames("image-item-container", {
                "isSelected":
                  index === selectedImage.index &&
                  img.src === selectedImage.src,
              })}
            >
              <CloseOutlinedIcon
                className="remove-icon"
                onClick={() => handleRemoveImage(img, index)}
              />
              <img
                key={index}
                src={img.src}
                width="150px"
                height="150px"
                className="represent-item"
                alt=""
                onClick={() => handleSelectImage(img, index)}
              />
            </Typography>
          );
        })}
        <Typography component="div" className="add-image-container">
          <ImageUploader
            withIcon={true}
            withPreview={true}
            label=""
            buttonText={
              <>
                <AddOutlinedIcon className="add-icon" />
              </>
            }
            onChange={handleSaveImages}
            imgExtension={[".jpg", ".gif", ".png", ".gif", ".svg", ".jpeg"]}
            maxFileSize={10485760000000}
            fileSizeError=" file size is too big"
          />
        </Typography>
      </Carousel>
    </Typography>
  );
};

export default ImagesCarousel;
