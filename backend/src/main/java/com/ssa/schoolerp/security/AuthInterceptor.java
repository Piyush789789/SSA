package com.ssa.schoolerp.security;

import com.ssa.schoolerp.exception.ApiErrors;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.lang.annotation.Annotation;
import java.util.Arrays;

/**
 * Authenticates every /api request from its Bearer token (unless the endpoint is {@link PublicEndpoint})
 * and enforces {@link RequireRole}. Finer-grained checks (which class or student a user may see) live in
 * {@link AccessGuard}.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String CURRENT_USER = AuthInterceptor.class.getName() + ".currentUser";

    private final AuthService authService;

    public AuthInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // CORS preflight and static resources are not controller methods.
        if (!(handler instanceof HandlerMethod method) || findAnnotation(method, PublicEndpoint.class) != null) {
            return true;
        }

        User user = authService.getUserByToken(request.getHeader(HttpHeaders.AUTHORIZATION));
        RequireRole required = findAnnotation(method, RequireRole.class);
        if (required != null && !Arrays.asList(required.value()).contains(user.getRole())) {
            throw ApiErrors.forbidden();
        }
        request.setAttribute(CURRENT_USER, user);
        return true;
    }

    private static <A extends Annotation> A findAnnotation(HandlerMethod method, Class<A> type) {
        A onMethod = method.getMethodAnnotation(type);
        return onMethod != null ? onMethod : AnnotatedElementUtils.findMergedAnnotation(method.getBeanType(), type);
    }
}
