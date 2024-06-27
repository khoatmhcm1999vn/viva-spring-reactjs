package com.vivacon.common.utility;

import com.vivacon.common.constant.Constants;
import com.vivacon.exception.NotValidImageExtensionException;
import com.vivacon.exception.UploadAttachmentException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class FileUtils {

    private static Logger logger = LoggerFactory.getLogger(FileUtils.class);

    private FileUtils() {
    }

    public static File convertMultiPartFileToFile(MultipartFile multipartFile) {

        File file = new File(multipartFile.getOriginalFilename());
        try (OutputStream outputStream = new FileOutputStream(file)) {
            outputStream.write(multipartFile.getBytes());
        } catch (IOException ex) {
            logger.error(String.format("Error converting the multi-part file to file %s", ex.getMessage()));
            throw new UploadAttachmentException("Can not convert " + multipartFile.getName() + " to file - some error in file format");
        }
        return file;
    }

    public static String getExtension(String fileName) {

        int lastDotIndex = fileName.lastIndexOf('.');
        int lastIndex = fileName.length();
        return fileName.substring(lastDotIndex, lastIndex);
    }

    public static boolean checkImageExtension(String extension) {
        return Constants.IMAGE_EXTENSIONS.contains(extension.toLowerCase(Locale.ROOT));
    }

    public static File convertAndValidateMultipartFileToFile(MultipartFile multipartFile) {
        File file = FileUtils.convertMultiPartFileToFile(multipartFile);
        String extension = FileUtils.getExtension(file.getName());
        if (!FileUtils.checkImageExtension(extension)) {
            throw new NotValidImageExtensionException();
        }
        return file;
    }

    public static List<File> convertAndValidateListImages(MultipartFile[] multipartFiles) {
        List<File> files = new ArrayList<>();
        for (MultipartFile multipartFile : multipartFiles) {
            if (multipartFile.isEmpty()) {
                throw new UploadAttachmentException(Constants.EMPTY_FILE_UPLOAD_MESSAGE);
            }
            File file = FileUtils.convertAndValidateMultipartFileToFile(multipartFile);
            files.add(file);
        }
        return files;
    }

    public static void deleteFile(File file) {
        try {
            Files.delete(file.toPath());
        } catch (IOException ex) {
            logger.error("Failed to delete the file {}", ex.getMessage());
        }
    }
}
