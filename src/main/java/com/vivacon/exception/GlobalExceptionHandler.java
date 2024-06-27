package com.vivacon.exception;

import com.vivacon.common.constant.Constants;
import com.vivacon.dto.ResponseDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import javax.persistence.NonUniqueResultException;
import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice(basePackages = "com.vivacon")
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException exception, HttpHeaders headers, HttpStatus status, WebRequest request) {
        List<String> errors = new ArrayList<>();
        for (FieldError error : exception.getBindingResult().getFieldErrors()) {
            errors.add(error.getField() + ": " + error.getDefaultMessage());
        }
        for (ObjectError error : exception.getBindingResult().getGlobalErrors()) {
            errors.add(error.getObjectName() + ": " + error.getDefaultMessage());
        }
        String errorToString = errors.toString();
        String errorsMessage = errorToString.substring(1, errorToString.length() - 1);
        ResponseDTO<Object> responseDTO = new ResponseDTO<>(HttpStatus.BAD_REQUEST, errorsMessage, null);
        return ResponseEntity.badRequest().body(responseDTO);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    public ResponseDTO<Object> onConstraintValidationException(ConstraintViolationException e) {
        List<String> listConstraintViolation = new ArrayList<>();
        for (ConstraintViolation<?> violation : e.getConstraintViolations()) {
            listConstraintViolation.add(violation.getMessage());
        }
        return new ResponseDTO<>(HttpStatus.BAD_REQUEST, listConstraintViolation.toString(), null);
    }

//    @ExceptionHandler(Exception.class)
//    @ResponseStatus(code = HttpStatus.INTERNAL_SERVER_ERROR)
//    public ResponseDTO<Object> handleUnwantedException(Exception ex) {
//        return new ResponseDTO<>(HttpStatus.INTERNAL_SERVER_ERROR, Constants.SERVER_ERROR_MESSAGE, null);
//    }

    @ExceptionHandler(UsernameNotFoundException.class)
    @ResponseStatus(code = HttpStatus.UNAUTHORIZED)
    public ResponseDTO<Object> handleInternalAuthenticationServiceException(UsernameNotFoundException exception) {
        return new ResponseDTO<>(HttpStatus.UNAUTHORIZED, Constants.USERNAME_NOT_FOUND, null);
    }

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(code = HttpStatus.UNAUTHORIZED)
    public ResponseDTO<Object> handleBadCredentialsException(BadCredentialsException exception) {
        return new ResponseDTO<>(HttpStatus.UNAUTHORIZED, Constants.BAD_CREDENTIALS, null);
    }

    @ExceptionHandler(value = TokenRefreshException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseDTO<Object> handleTokenRefreshException(TokenRefreshException ex) {
        return new ResponseDTO<>(HttpStatus.UNAUTHORIZED, ex.getMessage(), null);
    }

    @ExceptionHandler(value = VerificationTokenException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseDTO<Object> handleTokenRefreshException(VerificationTokenException ex) {
        return new ResponseDTO<>(HttpStatus.UNAUTHORIZED, ex.getMessage(), null);
    }

    @ExceptionHandler(value = RecordNotFoundException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseDTO<Object> handleRecordNotFoundException(RecordNotFoundException ex) {
        return new ResponseDTO<>(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    @ExceptionHandler(value = InvalidPasswordException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseDTO<Object> handleInvalidPasswordException(InvalidPasswordException ex) {
        return new ResponseDTO<>(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    @ExceptionHandler(value = NonUniqueResultException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseDTO<Object> handleNonUniqueResultException(NonUniqueResultException ex) {
        return new ResponseDTO<>(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    @ExceptionHandler(value = UploadAttachmentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseDTO<Object> handleUploadAttachmentException(UploadAttachmentException ex) {
        return new ResponseDTO<>(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    @ExceptionHandler(value = NotValidImageExtensionException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseDTO<Object> handleNotValidImageExtensionException(NotValidImageExtensionException ex) {
        return new ResponseDTO<>(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    @ExceptionHandler(value = NotValidSortingFieldName.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseDTO<Object> handleNotValidSortingFieldNameException(NotValidSortingFieldName ex) {
        return new ResponseDTO<>(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    @ExceptionHandler(value = UnauthorizedWebSocketException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseDTO<Object> handleNotValidSortingFieldNameException(UnauthorizedWebSocketException ex) {
        return new ResponseDTO<>(HttpStatus.FORBIDDEN, ex.getMessage(), null);
    }

    @ExceptionHandler(value = RestrictAccessUserResourceException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseDTO<Object> handleNotValidSortingFieldNameException(RestrictAccessUserResourceException ex) {
        return new ResponseDTO<>(HttpStatus.FORBIDDEN, ex.getMessage(), null);
    }
}
