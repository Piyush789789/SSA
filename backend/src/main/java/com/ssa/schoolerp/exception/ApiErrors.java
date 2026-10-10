package com.ssa.schoolerp.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Factory for the error responses the API returns; rendered by {@link GlobalExceptionHandler}. */
public final class ApiErrors {

    private ApiErrors() {
    }

    public static ResponseStatusException notFound(String entity, String id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, entity + " not found: " + id);
    }

    public static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    public static ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }

    public static ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }

    public static ResponseStatusException forbidden() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }
}
