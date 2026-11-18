package com.hotel.backend.dto;

/**
 * Returned ONCE when an employee is created or their password is reset by an authorized manager.
 * The temporaryPassword is never persisted in plaintext and cannot be retrieved again.
 */
public class EmployeeCredentialResponse {
    private EmployeeDto employee;
    private String temporaryPassword;

    public EmployeeCredentialResponse() {}

    public EmployeeCredentialResponse(EmployeeDto employee, String temporaryPassword) {
        this.employee = employee;
        this.temporaryPassword = temporaryPassword;
    }

    public EmployeeDto getEmployee() { return employee; }
    public void setEmployee(EmployeeDto employee) { this.employee = employee; }

    public String getTemporaryPassword() { return temporaryPassword; }
    public void setTemporaryPassword(String temporaryPassword) { this.temporaryPassword = temporaryPassword; }
}
