package com.vivacon.common.utility;

import com.vivacon.entity.Account;
import com.vivacon.entity.Attachment;
import com.vivacon.repository.AttachmentRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.UnsupportedJwtException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import static com.vivacon.common.constant.Constants.BLANK_AVATAR_URL;

@Component
public class JwtUtils {

    @Value("${vivacon.jwt.secret_salt}")
    private String jwtSecret;

    @Value("${vivacon.jwt.jwt_validity}")
    private long jwtValidity;

    @Value("${vivacon.jwt.jwt_issuer}")
    private String jwtIssuer;

    private AttachmentRepository attachmentRepository;

    public JwtUtils(AttachmentRepository attachmentRepository) {
        this.attachmentRepository = attachmentRepository;
    }

    /**
     * This method is used to get username from JWT access token
     *
     * @param token
     * @return
     */
    public String getUsername(String token) {
        Claims claims = Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token).getBody();
        return claims.get("username", String.class);
    }

    public Long getAccountId(String token) {
        Claims claims = Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token).getBody();
        return claims.get("accountId", Long.class);
    }

    public String getRole(String token) {
        Claims claims = Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token).getBody();
        List roles = claims.get("roles", List.class);
        return (String) roles.get(0);
    }

    /**
     * This method is used to generate a new JWT access token
     *
     * @param account, userDetails
     * @return String
     */
    public String generateAccessToken(Account account, List<String> roles) {

        Claims claims = Jwts.claims();
        claims.put("accountId", account.getId());
        claims.put("username", account.getUsername());
        claims.put("fullName", account.getFullName());
        claims.put("roles", roles);

        Optional<Attachment> optionalAvatar = attachmentRepository.findFirstByProfileIdOrderByTimestampDesc(account.getId());
        String avatarUrl = optionalAvatar.isPresent() ? optionalAvatar.get().getUrl() : BLANK_AVATAR_URL;
        claims.put("avatar", avatarUrl);

        return Jwts.builder()
                .setClaims(claims)
                .setIssuer(this.jwtIssuer)
                .setExpiration(new Date(System.currentTimeMillis() + jwtValidity))
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }

    /**
     * This method is used to validate a jwt access token
     *
     * @param token
     * @return
     */
    public boolean validate(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (SignatureException | MalformedJwtException | ExpiredJwtException | UnsupportedJwtException |
                 IllegalArgumentException ex) {
            ex.printStackTrace();
            throw ex;
        }
    }
}
