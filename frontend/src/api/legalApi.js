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
export const getContracts = async (params = {}) => {
  const response = await axiosClient.get("/contracts/", { params });
  return response.data;
};


export const createContract = async (contractData) => {
  const response = await axiosClient.post("/contracts/", contractData);
  return response.data;
};


export const updateContract = async (contractId, contractData) => {
  const response = await axiosClient.put(`/contracts/${contractId}`, contractData);
  return response.data;
};


export const deleteContract = async (contractId) => {
  const response = await axiosClient.delete(`/contracts/${contractId}`);
  return response.data;
};


export const getHearings = async (params = {}) => {
  const response = await axiosClient.get("/hearings/", { params });
  return response.data;
};


export const createHearing = async (hearingData) => {
  const response = await axiosClient.post("/hearings/", hearingData);
  return response.data;
};


export const updateHearing = async (hearingId, hearingData) => {
  const response = await axiosClient.put(`/hearings/${hearingId}`, hearingData);
  return response.data;
};


export const deleteHearing = async (hearingId) => {
  const response = await axiosClient.delete(`/hearings/${hearingId}`);
  return response.data;
};
export const getCourtDecisions = async (params = {}) => {
  const response = await axiosClient.get("/court-decisions/", { params });
  return response.data;
};


export const createCourtDecision = async (decisionData) => {
  const response = await axiosClient.post("/court-decisions/", decisionData);
  return response.data;
};


export const updateCourtDecision = async (decisionId, decisionData) => {
  const response = await axiosClient.put(
    `/court-decisions/${decisionId}`,
    decisionData
  );
  return response.data;
};


export const deleteCourtDecision = async (decisionId) => {
  const response = await axiosClient.delete(`/court-decisions/${decisionId}`);
  return response.data;
};
