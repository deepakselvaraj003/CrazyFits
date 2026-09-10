import api from "../api/axios";

export const createDesign = (data) =>
  api.post("designs/design/", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const getDesigns = () =>
  api.get("designs/design/");

export const getMyDesigns = () =>
  api.get("designs/my-designs/");

export const updateDesign = (id, data) =>
  api.patch(`designs/design/${id}/`, data);

export const deleteDesign = (id) =>
  api.delete(`designs/design/${id}/`);