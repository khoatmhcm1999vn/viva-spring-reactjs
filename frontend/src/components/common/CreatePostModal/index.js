import {
  Modal,
  Box,
  Typography,
  Card,
  CardContent,
  AppBar,
  Button,
} from "@mui/material";
import { useState, useEffect, useContext } from "react";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import "./style.scss";
import StepperChange from "components/common/CreatePostModal/StepperChange";
import UploadImageTab from "components/common/CreatePostModal/UploadImageTab";
import classNames from "classnames";
import EditImagesTab from "components/common/CreatePostModal/EditImagesTab";
import ConfirmDialog from "components/common/ConfirmDialog";
import WriteCaptionTab from "components/common/CreatePostModal/WriteCaptionTab";
import { uploadImages } from "api/postService";
import { Loading, Snackbar } from "App";
import { privacyPostType } from "constant/types";
import { createPost } from "api/postService";
import { useTranslation } from "react-i18next";
import { detectImages } from "api/imageModerationService";
import { handleCheckImageRange } from "utils/resolveData";
import CustomModal from "../CustomModal";
// const fs = require("fs");

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
};

const CreatePostModal = (props) => {
  const { open, handleClose } = props;
  const [activeStep, setActiveStep] = useState(0);
  const [pictures, setPictures] = useState([]);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [isBack, setIsBack] = useState(false);
  const [privacy, setPrivacy] = useState(privacyPostType[0].value);
  const [caption, setCaption] = useState("");
  const [maliciousImages, setMaliciousImages] = useState([]);
  const [openForbiddenImages, setOpenForbiddenImages] = useState(false);

  const { setLoading } = useContext(Loading);
  const { setSnackbarState } = useContext(Snackbar);

  const { t: trans } = useTranslation();

  const steps = [
    trans("createPost.uploadImages"),
    trans("createPost.edit"),
    trans("createPost.writeCaption"),
  ];

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      setLoading(true);
      const data = new FormData();
      pictures.map((item) => {
        data.append("files", item.file);
      });
      const { data: attachments } = await uploadImages(data);

      // const mockData = [
      //   {
      //     actualName: "Screenshot (25).png",
      //     uniqueName: "2022-06-26T14:18:16.759565_Screenshot (25).png",
      //     url: "https://previews.123rf.com/images/tommisch/tommisch2003/tommisch200300094/141520488-strong-man-strangling-scared-female-with-bruises-on-her-face-blood-from-her-mouth-flows-down-his-arm.jpg",
      //   },
      //   {
      //     actualName: "Screenshot (24).png",
      //     uniqueName: "2022-06-26T14:18:18.512730_Screenshot (24).png",
      //     url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTk_DobG4W7lLpLDpzg0THlrG4sr9wGxa2efVdyHk41uCe_CVCv4xgh1fKBMOtsJrl-cSg&usqp=CAU",
      //   },
      //   {
      //     actualName: "Screenshot (23).png",
      //     uniqueName: "2022-06-26T14:18:18.870703_Screenshot (23).png",
      //     url: "https://upload.wikimedia.org/wikipedia/commons/7/76/Dangerous_weapons_seized_from_holiday_flights_at_Manchester_Airport.jpg",
      //   },
      // ];
      let resultCheckedImages = [];
      await Promise.all(
        attachments.map(async (img) => {
          const res = await detectImages(img);
          console.log({ res });
          const checkedImage = handleCheckImageRange(img.url, res.data);
          if (checkedImage.maliciousRange.length > 0) {
            resultCheckedImages.push(checkedImage);
          }
        })
      );
      if (resultCheckedImages.length === 0) {
        handlePost({
          privacy,
          caption,
          attachments,
        });
      } else {
        setMaliciousImages(resultCheckedImages);
        setLoading(false);
        setOpenForbiddenImages(true);
      }
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleSaveImages = (pictureFiles) => {
    pictureFiles.map((pic) => {
      setPictures((prev) => [
        ...prev,
        { src: URL.createObjectURL(pic), file: pic },
      ]);
    });
    if (activeStep === 0) {
      handleNext();
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      return null;
    }
    if (activeStep === 1) {
      setIsBack(true);
      setOpenConfirmDialog(true);
    } else {
      setActiveStep(activeStep - 1);
    }
  };

  const handleCloseModal = () => {
    if (activeStep > 0) {
      setOpenConfirmDialog(true);
    } else {
      handleClose();
    }
  };

  const handleRemoveImage = (image) => {
    setPictures(pictures.filter((item) => item !== image));
  };

  const handleEditedUpdateImage = (newImageSrc, newImageFile, index) => {
    pictures[index].src = newImageSrc;
    pictures[index].file = newImageFile;
    setPictures([...pictures]);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleConfirmDialog = () => {
    if (isBack) {
      setActiveStep(0);
      setIsBack(false);
    } else {
      handleClose();
      setActiveStep(0);
    }
    setPictures([]);
    setOpenConfirmDialog(false);
  };

  const handlePrivacySelectChange = (event) => {
    setPrivacy(event.target.value);
  };

  const handleCaptionChange = (event) => {
    setCaption(event.target.value);
  };

  const handlePost = (data) => {
    createPost(data)
      .then((res) => {
        handleClose();
        setActiveStep(0);
        setPictures([]);

        setTimeout(() => {
          setSnackbarState({
            open: true,
            content: trans("createPost.successfully"),
            type: "SUCCESS",
          });
        }, 1000);
      })
      .catch((err) => {
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (pictures.length === 0) {
      setActiveStep(0);
    }
  }, [pictures]);

  const hideButtonClass = classNames({
    hidden: activeStep === 0 || activeStep > steps.length - 1,
  });

  return (
    <>
      <Modal
        open={open}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        className="modal-container"
      >
        <Card className="create-post-container">
          <CardContent>
            <Box sx={{ width: "100%", height: "100%" }}>
              <AppBar className="create-post-header">
                <Button
                  className={`btn-container ${hideButtonClass}`}
                  onClick={handleBack}
                >
                  <ChevronLeftOutlinedIcon />
                  {trans("createPost.back")}
                </Button>
                <Typography className="title">
                  {trans("createPost.createNewPost")}
                </Typography>
                <Button
                  className={`btn-container ${hideButtonClass}`}
                  onClick={handleNext}
                >
                  {activeStep === steps.length - 1 ? (
                    trans("profile.post")
                  ) : (
                    <>
                      {trans("createPost.next")} <ChevronRightOutlinedIcon />
                    </>
                  )}
                </Button>
              </AppBar>
              <StepperChange steps={steps} activeStep={activeStep} />
              <TabPanel value={activeStep} index={0} className="tab-container">
                <UploadImageTab
                  handleNextTab={handleNext}
                  handleSaveImages={handleSaveImages}
                />
              </TabPanel>
              <TabPanel value={activeStep} index={1} className="tab-container">
                <EditImagesTab
                  pictures={pictures}
                  handleRemoveImage={handleRemoveImage}
                  handleSaveImages={handleSaveImages}
                  handleEditedUpdateImage={handleEditedUpdateImage}
                />
              </TabPanel>
              <TabPanel value={activeStep} index={2} className="tab-container">
                <WriteCaptionTab
                  pictures={pictures}
                  privacy={privacy}
                  caption={caption}
                  handleRemoveImage={handleRemoveImage}
                  handleSaveImages={handleSaveImages}
                  handleSelectChange={handlePrivacySelectChange}
                  handleCaptionChange={handleCaptionChange}
                />
              </TabPanel>
            </Box>
            <ConfirmDialog
              handleClose={handleCloseConfirmDialog}
              handleConfirm={handleConfirmDialog}
              open={openConfirmDialog}
              title={trans("createPost.confirm")}
              description={trans("createPost.deleteImage")}
            />
          </CardContent>
        </Card>
      </Modal>
      <CustomModal
        isRadius
        width={400}
        height={450}
        open={openForbiddenImages}
        title="Some of your pictures violate our community standards"
        handleCloseModal={() => {
          setOpenForbiddenImages(false);
          setMaliciousImages([]);
        }}
      >
        <Typography component="div" className="forbidden-list-container">
          {maliciousImages.length > 0 &&
            maliciousImages.map((item) => {
              return (
                <Typography
                  component="div"
                  className="forbidden-image-container"
                >
                  <img
                    className="forbidden-image"
                    src={item.image}
                    width="100px"
                    height="100px"
                  />
                  <Typography component="ul" className="forbidden-reason">
                    {item.maliciousRange?.map((reason) => (
                      <li>{reason}</li>
                    ))}
                  </Typography>
                </Typography>
              );
            })}
        </Typography>
      </CustomModal>
    </>
  );
};

export default CreatePostModal;
