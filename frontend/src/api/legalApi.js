import axiosClient from "./axiosClient";


// CASES


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


// CONTRACTS
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


// DOCUMENTS


export const getDocuments = async (params = {}) => {
  const response = await axiosClient.get("/documents/", { params });
  return response.data;
};


export const createDocument = async (documentData) => {
  const response = await axiosClient.post("/documents/", documentData);
  return response.data;
};


export const updateDocument = async (documentId, documentData) => {
  const response = await axiosClient.put(
    `/documents/${documentId}`,
    documentData
  );
  return response.data;
};


export const deleteDocument = async (documentId) => {
  const response = await axiosClient.delete(
    `/documents/${documentId}`
  );
  return response.data;
};


export const getDocumentCategories = async (params = {}) => {
  const response = await axiosClient.get(
    "/document-categories/",
    { params }
  );
  return response.data;
};


export const createDocumentCategory = async (categoryData) => {
  const response = await axiosClient.post("/document-categories/", categoryData);
  return response.data;
};


export const updateDocumentCategory = async (categoryId, categoryData) => {
  const response = await axiosClient.put(
    `/document-categories/${categoryId}`,
    categoryData
  );
  return response.data;
};


export const deleteDocumentCategory = async (categoryId) => {
  const response = await axiosClient.delete(`/document-categories/${categoryId}`);
  return response.data;
};

