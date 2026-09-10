import api from "../api/axios";

export const getNotifications = () =>
    api.get("requests/notifications/");

export const markNotificationAsRead = (id) =>
    api.patch(`requests/notifications/${id}/read/`);

export const deleteNotification = (id) =>
    api.delete(`requests/notifications/${id}/`);

export const emptyAllNotifications = () =>
    api.delete("requests/notifications/empty-all/");
