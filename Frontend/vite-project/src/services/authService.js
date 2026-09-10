import api from "../api/axios";

export const adminLogin = (data) => {
    return api.post("account/login/", data);
};

export const sendOTP = (data) => {
    return api.post("account/send-otp/", data);
};

export const verifyOTP = (data) => {
    return api.post("account/verify-otp/", data);
};


export const getProfile = () => {
    return api.get("account/profile/");
};

export const changeAdminSecurity = (data) => {
    return api.post("account/admin/security/", data);
};

export const verifyAdminEmail = (data) => {
    return api.post("account/admin/security/verify/", data);
};

export const updateAdminProfile = (data) => {
   return api.patch("account/admin/security/", data);
};

export const getGoogleDriveStatus = () => {
    return api.get("account/google/status/");
};

export const getGoogleDriveAuthUrl = () => {
    return api.get("account/google/auth-url/");
};