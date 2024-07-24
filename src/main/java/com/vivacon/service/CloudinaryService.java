package com.vivacon.service;

import com.vivacon.dto.AttachmentDTO;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;

public interface CloudinaryService {

    AttachmentDTO uploadFile(MultipartFile multipartFile);

    List<AttachmentDTO> uploadFile(List<File> file);

}
