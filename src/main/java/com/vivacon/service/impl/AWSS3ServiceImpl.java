package com.vivacon.service.impl;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.DeleteObjectRequest;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.vivacon.common.utility.FileUtils;
import com.vivacon.dto.AttachmentDTO;
import com.vivacon.exception.UploadAttachmentException;
import com.vivacon.service.AWSS3Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static com.vivacon.common.constant.Constants.ERROR_WHEN_UPLOAD_TO_S3;

@Service
public class AWSS3ServiceImpl implements AWSS3Service {

    private Logger logger = LoggerFactory.getLogger(this.getClass());

    @Value("${aws.s3.bucket}")
    private String bucketName;

    private AmazonS3 amazonS3;

    public AWSS3ServiceImpl(AmazonS3 amazonS3) {
        this.amazonS3 = amazonS3;
    }

    @Override
    public AttachmentDTO uploadFile(MultipartFile multipartFile) {
        String actualFileName = null;
        try {
            File file = FileUtils.convertAndValidateMultipartFileToFile(multipartFile);
            actualFileName = file.getName();
            String uniqueFileName = LocalDateTime.now() + "_" + file.getName();
            String attachmentUrl = uploadFileToS3Bucket(bucketName, uniqueFileName, file);
            FileUtils.deleteFile(file);
            return new AttachmentDTO(actualFileName, uniqueFileName, attachmentUrl);
        } catch (AmazonServiceException ex) {
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
                String attachmentUrl = uploadFileToS3Bucket(bucketName, uniqueFileName, file);
                listAttachments.add(new AttachmentDTO(actualFileName, uniqueFileName, attachmentUrl));
                FileUtils.deleteFile(file);
            } catch (AmazonServiceException ex) {
                logger.error(String.format("Error %s while uploading file", ex.getMessage()));
                throw new UploadAttachmentException(ERROR_WHEN_UPLOAD_TO_S3);
            }
        }
        return listAttachments;
    }


    private String uploadFileToS3Bucket(String bucketName, String uniqueFileName, final File file) {
        PutObjectRequest putObjectRequest = new PutObjectRequest(bucketName, uniqueFileName, file);
        putObjectRequest.withCannedAcl(CannedAccessControlList.PublicRead);
        this.amazonS3.putObject(putObjectRequest);
        return this.amazonS3.getUrl(bucketName, uniqueFileName).toString();
    }

    @Override
    public void deleteFileFromS3Bucket(String fileName) {
        try {
            amazonS3.deleteObject(new DeleteObjectRequest(bucketName, fileName));
        } catch (AmazonServiceException ex) {
            logger.error(String.format("Error %s occurred while removing %s", ex.getMessage(), fileName));
        }
    }
}
