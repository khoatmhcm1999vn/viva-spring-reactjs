package com.vivacon.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vivacon.common.utility.FileUtils;
import com.vivacon.dto.AttachmentDTO;
import com.vivacon.exception.UploadAttachmentException;
import com.vivacon.service.CloudinaryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.vivacon.common.constant.Constants.ERROR_WHEN_UPLOAD_TO_S3;

@Service
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    private final Cloudinary cloudinary;

    public CloudinaryServiceImpl(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @Override
    public AttachmentDTO uploadFile(MultipartFile multipartFile) {
        String actualFileName = null;
        try {
            File file = FileUtils.convertAndValidateMultipartFileToFile(multipartFile);
            actualFileName = file.getName();
            String uniqueFileName = LocalDateTime.now() + "_" + file.getName();
            String attachmentUrl = this.uploadFileToCloudinary(file);
            FileUtils.deleteFile(file);
            return new AttachmentDTO(actualFileName, uniqueFileName, attachmentUrl);
        } catch (IOException ex) {
            logger.error(String.format("Error %s while uploading file", ex.getMessage()));
            throw new UploadAttachmentException(actualFileName + ERROR_WHEN_UPLOAD_TO_S3);
        }
    }

    @Override
    public List<AttachmentDTO> uploadFile(List<File> files) {
        List<AttachmentDTO> listAttachments = new ArrayList<>();
        for (File file : files) {
            try {
                String actualFileName = file.getName();
                String uniqueFileName = LocalDateTime.now() + "_" + file.getName();
                String attachmentUrl = this.uploadFileToCloudinary(file);
                listAttachments.add(new AttachmentDTO(actualFileName, uniqueFileName, attachmentUrl));
                FileUtils.deleteFile(file);
            } catch (IOException ex) {
                logger.error(String.format("Error %s while uploading file", ex.getMessage()));
                throw new UploadAttachmentException(ERROR_WHEN_UPLOAD_TO_S3);
            }
        }
        return listAttachments;
    }

    private String uploadFileToCloudinary(final File file) throws IOException {
        Map folderName = cloudinary.uploader().upload(file, ObjectUtils.asMap("folder", ""));
        return (String) folderName.get("secure_url");
    }

}
