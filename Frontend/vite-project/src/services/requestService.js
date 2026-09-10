import api from "../api/axios";

export const sendQuote = (data) =>
  api.post("requests/requests/", data);

export const getRequests = (page = 1, pageSize = 10) =>
  api.get(`requests/requests/?page=${page}&page_size=${pageSize}`);

export const updateRequestStatus = (data) =>
  api.patch("requests/requests/", data);

export const getSingleRequest = (id) =>
  api.get(`requests/requests/${id}/`);

export const getDashboard = () =>
    api.get("requests/dashboard/");

export const filterRequests = (data,page = 1,pageSize = 10) =>
    api.post(`requests/requests/filter/?page=${page}&page_size=${pageSize}`,data);

export const downloadPNGs = (id, side) =>
    api.get(`requests/requests/${id}/download-pngs/${side}/`, { responseType: "blob" });