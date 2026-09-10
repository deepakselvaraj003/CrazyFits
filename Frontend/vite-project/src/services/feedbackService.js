import api from "../api/axios";

export const getFeedbacks = (page = 1, pageSize = 10) => {
    return api.get(`feedbacks/admin/?page=${page}&page_size=${pageSize}`);
};

export const getFeedback = (id) => {
    return api.get(`feedbacks/admin/${id}/`);
};

export const replyFeedback = (data) => {
    return api.post("feedbacks/admin/", data);
};

export const editReply = (data) => {
    return api.patch("feedbacks/admin/", data);
};

export const filterFeedbacks = (data) => {
    return api.post("feedbacks/admin/filter/", data);
};


export const getPublicFeedbacks = () => {
    return api.get("feedbacks/");
};

export const createFeedback = (data) => {
    return api.post("feedbacks/", data);
};

export const updateFeedback = (id, data) => {
    return api.patch(`feedbacks/${id}/`, data);
};