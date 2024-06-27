package com.vivacon.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vivacon.dto.ResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AccountExpiredException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

import static com.vivacon.common.constant.Constants.ACCOUNT_STATUS_EXCEPTION_MESSAGE_KEY;
import static com.vivacon.common.constant.Constants.ERROR_MESSAGE_ATTRIBUTE_HTTP_REQUEST;
import static com.vivacon.common.constant.Constants.JSON_CONTENT_TYPE;
import static com.vivacon.common.constant.Constants.OBJECT_NULL_CANT_CONVERT_TO_JSON;
import static com.vivacon.common.constant.Constants.UNAUTHORIZED_REASON;

/**
 * This class is used to catch all exceptions which extend from AuthenticationException through the filter pipeline of
 * Spring Security
 */
@Component
public class AuthenticationEntryPointImpl implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationEntryPointImpl.class);

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {
        logger.error(UNAUTHORIZED_REASON, authException.getMessage());
        if (request.getAttribute(ERROR_MESSAGE_ATTRIBUTE_HTTP_REQUEST) != null) {
            sendErrorHandlerResponse(response, HttpStatus.UNAUTHORIZED.value(), request.getAttribute(ERROR_MESSAGE_ATTRIBUTE_HTTP_REQUEST).toString());
            return;
        }
        if (request.getAttribute(ACCOUNT_STATUS_EXCEPTION_MESSAGE_KEY) != null) {
            sendErrorHandlerResponse(response, HttpStatus.FORBIDDEN.value(), request.getAttribute(ACCOUNT_STATUS_EXCEPTION_MESSAGE_KEY).toString());
            return;
        }
        if (authException instanceof LockedException
                || authException instanceof AccountExpiredException
                || authException instanceof DisabledException
                || authException instanceof CredentialsExpiredException) {
            sendErrorHandlerResponse(response, HttpStatus.FORBIDDEN.value(), authException.getMessage());
        }
    }

    private void sendErrorHandlerResponse(HttpServletResponse response, int httpStatusCode, String message) throws IOException {
        ResponseDTO<Object> responseDTO = new ResponseDTO<>(httpStatusCode == 403 ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED, message);
        response.setStatus(httpStatusCode);
        response.setContentType(JSON_CONTENT_TYPE);
        response.getWriter().write(convertObjectToJson(responseDTO));
    }

    public static String convertObjectToJson(Object object) throws JsonProcessingException {
        Assert.notNull(object, OBJECT_NULL_CANT_CONVERT_TO_JSON);
        ObjectMapper mapper = new ObjectMapper();
        return mapper.writeValueAsString(object);
    }
}