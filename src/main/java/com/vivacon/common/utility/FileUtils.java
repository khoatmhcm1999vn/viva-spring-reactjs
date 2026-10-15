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
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class FileUtils {

    private static Logger logger = LoggerFactory.getLogger(FileUtils.class);

    private FileUtils() {
    }

    public static File convertMultiPartFileToFile(MultipartFile multipartFile) {

        // Moi file nam trong mot thu muc tam rieng nhung giu ten goc (actualName lay tu
        // file.getName()). Truoc day file ghi thang vao thu muc lam viec theo ten goc, nen
        // hai anh trung ten trong cung request (hoac hai nguoi cung upload "image.jpg")
        // ghi de va xoa mat file cua nhau: Cloudinary bao "No such file" va API tra 400.
        // Chi lay phan ten, bo duong dan, de ten file khong tro ra ngoai thu muc tam.
        String originalName = Paths.get(String.valueOf(multipartFile.getOriginalFilename()))
                .getFileName().toString();
        File file;
        try {
            Path tempDirectory = Files.createTempDirectory("vivacon-upload-");
            file = tempDirectory.resolve(originalName).toFile();
        } catch (IOException ex) {
            logger.error(String.format("Error creating a temporary directory %s", ex.getMessage()));
            throw new UploadAttachmentException("Can not convert " + multipartFile.getName() + " to file - some error in file format");
        }
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
            // Xoa luon thu muc tam rieng cua file (tao trong convertMultiPartFileToFile).
            Files.deleteIfExists(file.toPath().getParent());
        } catch (IOException ex) {
            logger.error("Failed to delete the file {}", ex.getMessage());
        }
    }
}
