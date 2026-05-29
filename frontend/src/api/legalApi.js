import axiosClient from "./axiosClient";

export const getCases = async (params = {}) => {
  const response = await axiosClient.get("/cases/", { params });
  return response.data;
};

export const createCase = async (caseData) => {
  const response = await axiosClient.post("/cases/", caseData);
  return response.data;
};

export const updateCase = async (caseId, caseData) => {
  const response = await axiosClient.put(`/cases/${caseId}`, caseData);
  return response.data;
};

export const deleteCase = async (caseId) => {
  const response = await axiosClient.delete(`/cases/${caseId}`);
  return response.data;
};