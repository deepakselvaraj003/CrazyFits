import api from "../api/axios";

/* ---------- Customer ---------- */

export const getCategories = async () => {
    const response = await api.get("gallery/categories/");
    return response.data.data;
};

export const getDesigns = async (
    categoryId = null,
    page = 1,
    pageSize = 10,
    raw = false
) => {

    let url = `gallery/designs/?page=${page}&page_size=${pageSize}`;

    if (categoryId) {
        url += `&category_id=${categoryId}`;
    }

    const response = await api.get(url);

    return raw ? response.data : response.data.data;
};

/* ---------- Admin Category ---------- */

export const createCategory = (data) =>
    api.post("gallery/categories/", data);

export const updateCategory = (data) =>
    api.patch("gallery/categories/", data);

export const deleteCategory = (category_ids) =>
    api.delete("gallery/categories/", {
        data: { category_ids },
    });

/* ---------- Admin Design ---------- */

export const createDesign = (formData) =>
    api.post("gallery/designs/", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

export const updateDesign = (id, formData) =>
    api.patch(`gallery/designs/${id}/`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

export const deleteDesign = (id) =>
    api.delete(`gallery/designs/${id}/`);

export const getSingleDesign = (id) =>
    api.get(`gallery/designs/${id}/`);