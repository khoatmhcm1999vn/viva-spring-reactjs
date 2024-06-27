package com.vivacon.security;

import com.vivacon.common.utility.JwtUtils;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AccountStatusException;
import org.springframework.security.authentication.AccountStatusUserDetailsChecker;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.vivacon.common.constant.Constants.ACCESS_TOKEN_MISSING;
import static com.vivacon.common.constant.Constants.ACCOUNT_STATUS_EXCEPTION_MESSAGE_KEY;
import static com.vivacon.common.constant.Constants.AUTHORIZATION_BEARER;
import static com.vivacon.common.constant.Constants.AUTHORIZATION_HEADER;
import static com.vivacon.common.constant.Constants.CAN_NOT_SET_AUTHENTICATION_VALUE;
import static com.vivacon.common.constant.Constants.ERROR_MESSAGE_ATTRIBUTE_HTTP_REQUEST;
import static com.vivacon.common.constant.Constants.URL_WHITELIST;

@Component
public class JWTRequestFilter extends OncePerRequestFilter {

    private JwtUtils jwtUtils;

    private UserDetailsService userDetailsService;

    @Autowired
    public JWTRequestFilter(JwtUtils jwtTokenUtil, UserDetailsService userDetailsService) {
        this.jwtUtils = jwtTokenUtil;
        this.userDetailsService = userDetailsService;
    }

    /**
     * This method is used to take jwt access token and decide is it valid or not to store in security context holder
     *
     * @param request
     * @param response
     * @param filterChain
     * @throws ServletException
     * @throws IOException
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        AccountStatusUserDetailsChecker statusUserDetailsChecker = new AccountStatusUserDetailsChecker();
        String requestURI = request.getRequestURI();
        if (checkoutWSAccess(requestURI) || checkStaticFileAccess(requestURI)) {
            filterChain.doFilter(request, response);
        } else {
            if (URL_WHITELIST.stream().noneMatch(requestURI::equals)) {
                try {
                    String token = getTokenFromRequest(request);
                    if (Objects.nonNull(token)) {
                        if (jwtUtils.validate(token)) {
                            String username = jwtUtils.getUsername(token);
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            statusUserDetailsChecker.check(userDetails);
                            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    } else {
                        throw new JwtException(ACCESS_TOKEN_MISSING);
                    }
                } catch (JwtException ex) {
                    logger.error(CAN_NOT_SET_AUTHENTICATION_VALUE, ex);
                    request.setAttribute(ERROR_MESSAGE_ATTRIBUTE_HTTP_REQUEST, ex.getMessage());
                } catch (AccountStatusException ex) {
                    logger.error(CAN_NOT_SET_AUTHENTICATION_VALUE, ex);
                    request.setAttribute(ACCOUNT_STATUS_EXCEPTION_MESSAGE_KEY, ex.getMessage());
                }
            }
            filterChain.doFilter(request, response);
        }
    }

    private boolean checkoutWSAccess(String uri) {
        Pattern pattern = Pattern.compile("(/ws).*");
        Matcher matcher = pattern.matcher(uri);
        return matcher.find();
    }

    private boolean checkStaticFileAccess(String uri) {
        Pattern pattern = Pattern.compile("(\\/static\\/).*");
        Matcher matcher = pattern.matcher(uri);
        return matcher.find();
    }

    /**
     * This method is used to get jwt value from the authorization http header
     *
     * @param request
     * @return
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String token = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(token) && token.startsWith(AUTHORIZATION_BEARER)) {
            return token.substring(AUTHORIZATION_BEARER.length());
        }
        return null;
    }
}
