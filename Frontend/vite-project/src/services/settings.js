import api from "../api/axios";

export const getSettings = () =>
    api.get("settings/platformsettings/");

export const updateSettings = (data) =>
    api.patch("settings/platformsettings/", data);