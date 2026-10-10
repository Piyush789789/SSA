package com.ssa.schoolerp.controller;

import com.ssa.schoolerp.dto.ApiResponse;
import com.ssa.schoolerp.model.Notification;
import com.ssa.schoolerp.model.User;
import com.ssa.schoolerp.security.CurrentUser;
import com.ssa.schoolerp.service.NotificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** The signed-in user's notifications, and registering a phone for push notifications. */
@RestController
@RequestMapping("/api")
public class NotificationController {

    public record PushTokenRequest(@NotBlank String token, String platform) {
    }

    private final NotificationService notifications;

    public NotificationController(NotificationService notifications) {
        this.notifications = notifications;
    }

    @GetMapping("/notifications")
    public ApiResponse<List<Notification>> inbox(@CurrentUser User user, @RequestParam(defaultValue = "50") int limit) {
        return ApiResponse.of(notifications.inbox(user, limit));
    }

    @GetMapping("/notifications/unread-count")
    public ApiResponse<Map<String, Long>> unreadCount(@CurrentUser User user) {
        return ApiResponse.of(Map.of("unread", notifications.unreadCount(user)));
    }

    @PostMapping("/notifications/{id}/read")
    public ApiResponse<Void> markRead(@CurrentUser User user, @PathVariable String id) {
        notifications.markRead(user, id);
        return ApiResponse.success("Marked as read");
    }

    @PostMapping("/notifications/read-all")
    public ApiResponse<Void> markAllRead(@CurrentUser User user) {
        notifications.markAllRead(user);
        return ApiResponse.success("All marked as read");
    }

    @PostMapping("/me/push-token")
    public ApiResponse<Void> registerPushToken(@CurrentUser User user, @Valid @RequestBody PushTokenRequest request) {
        notifications.registerPushToken(user, request.token(), request.platform());
        return ApiResponse.success("Push notifications enabled");
    }

    @DeleteMapping("/me/push-token")
    public ApiResponse<Void> removePushToken(@RequestParam String token) {
        notifications.removePushToken(token);
        return ApiResponse.success("Push notifications disabled");
    }
}
