package com.vivacon.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.regex.Pattern;

/**
 * PasswordEncoder CHI DANH CHO DEV: luu mat khau dang chu thuong de co the sua thang cot
 * account.password trong database ma khong phai tu tinh hash.
 *
 * - encode() tra lai nguyen mat khau, khong hash.
 * - matches() van nhan hash BCrypt da co san trong DB (tai khoan tao truoc khi bat co,
 *   hoac du lieu restore tu dump), con lai so sanh chu thuong.
 *
 * Duoc chon trong HTTPSecurityConfiguration khi vivacon.security.plaintext-passwords bat
 * (chi o profile dev). KHONG bao gio bat tren production: ai doc duoc database, ban dump
 * hay log SQL deu doc duoc mat khau cua moi nguoi dung.
 */
public class DevPlaintextPasswordEncoder implements PasswordEncoder {

    private static final Pattern BCRYPT_PATTERN = Pattern.compile("\\A\\$2[aby]?\\$\\d\\d\\$[./0-9A-Za-z]{53}");

    private BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();

    @Override
    public String encode(CharSequence rawPassword) {
        return rawPassword.toString();
    }

    @Override
    public boolean matches(CharSequence rawPassword, String storedPassword) {
        if (rawPassword == null || storedPassword == null) {
            return false;
        }
        if (BCRYPT_PATTERN.matcher(storedPassword).matches()) {
            return bCryptPasswordEncoder.matches(rawPassword, storedPassword);
        }
        return MessageDigest.isEqual(rawPassword.toString().getBytes(StandardCharsets.UTF_8),
                storedPassword.getBytes(StandardCharsets.UTF_8));
    }
}
