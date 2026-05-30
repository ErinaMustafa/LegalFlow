import axiosClient from "./axiosClient";

export const getAuditLogs = async (params = {}) => {
  const response = await axiosClient.get("/audit-logs/", { params });
  return response.data;
};

export const deleteAuditLog = async (logId) => {
  const response = await axiosClient.delete(`/audit-logs/${logId}`);
  return response.data;
};
