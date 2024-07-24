package com.vivacon.controller;

import com.vivacon.common.constant.Constants;
import com.vivacon.common.utility.FileUtils;
import com.vivacon.dto.AttachmentDTO;
import com.vivacon.exception.UploadAttachmentException;
import com.vivacon.service.CloudinaryService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;

@Api(value = "Attachment Controller")
@RestController
public class AttachmentController {

    private final CloudinaryService cloudinaryService;

    public AttachmentController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    @ApiOperation(value = "Upload attachment to the cloud storage")
    @PostMapping(value = Constants.API_V1 + "/attachment")
    public AttachmentDTO uploadImage(@RequestParam("file") MultipartFile file) {
        if (!file.isEmpty()) {
            return this.cloudinaryService.uploadFile(file);
        }
        throw new UploadAttachmentException(Constants.EMPTY_FILE_UPLOAD_MESSAGE);
    }

    @ApiOperation(value = "Upload attachment to the cloud storage")
    @PostMapping(value = Constants.API_V1 + "/attachments")
    public List<AttachmentDTO> uploadImages(@RequestParam("files") MultipartFile[] files) {
        List<File> listImages = FileUtils.convertAndValidateListImages(files);
        return this.cloudinaryService.uploadFile(listImages);
    }

}
