
import axiosClient from "./axiosClient";

export const getAIAnalyses = async (params = {}) => {
  const response = await axiosClient.get("/ai-analyses/", { params });
  return response.data;
};

export const analyzeText = async (analysisData) => {
  const response = await axiosClient.post(
    "/ai-analyses/analyze-text",
    analysisData
  );
  return response.data;
};

export const createAIAnalysis = async (analysisData) => {
  const response = await axiosClient.post("/ai-analyses/", analysisData);
  return response.data;
};

export const updateAIAnalysis = async (analysisId, analysisData) => {
  const response = await axiosClient.put(
    `/ai-analyses/${analysisId}`,
    analysisData
  );
  return response.data;
};

export const deleteAIAnalysis = async (analysisId) => {
  const response = await axiosClient.delete(`/ai-analyses/${analysisId}`);
  return response.data;
};
