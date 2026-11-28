package com.hotel.backend.service;

import java.util.regex.Pattern;

/**
 * Shared validation, normalization, and lookup-matching rules for guest stay phone numbers and emails.
 */
public final class GuestContactHelper {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");

    private GuestContactHelper() {}

    public record ValidatedContact(String email, String phone) {}

    public static String normalizeEmail(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String cleaned = raw.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(cleaned).matches()) {
            throw new IllegalArgumentException("Enter a valid email address.");
        }
        return cleaned;
    }

    public static String normalizePhone(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String cleaned = raw.trim();
        String digits = extractDigits(cleaned);
        if (digits.length() < 7 || digits.length() > 15) {
            throw new IllegalArgumentException("Enter a valid phone number (7 to 15 digits).");
        }
        return cleaned;
    }

    public static ValidatedContact validateAndRequireAtLeastOne(String rawEmail, String rawPhone) {
        String email = normalizeEmail(rawEmail);
        String phone = normalizePhone(rawPhone);
        if (email == null && phone == null) {
            throw new IllegalArgumentException("At least a phone number or an email address is required to register the guest.");
        }
        return new ValidatedContact(email, phone);
    }

    public static String extractDigits(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replaceAll("\\D", "");
    }

    public static boolean emailsMatch(String storedEmail, String candidateEmail) {
        if (storedEmail == null || candidateEmail == null) {
            return false;
        }
        String a = storedEmail.trim().toLowerCase();
        String b = candidateEmail.trim().toLowerCase();
        return !a.isEmpty() && a.equals(b);
    }

    public static boolean phonesMatch(String storedPhone, String candidatePhone) {
        String a = extractDigits(storedPhone);
        String b = extractDigits(candidatePhone);
        if (a.length() < 7 || b.length() < 7) {
            return false;
        }
        if (a.equals(b)) {
            return true;
        }
        // Handle country code differences (e.g. "+91 9876543210" vs "9876543210" or "09876543210")
        if (a.length() >= 10 && b.length() >= 10) {
            return a.substring(a.length() - 10).equals(b.substring(b.length() - 10));
        }
        return false;
    }
}
