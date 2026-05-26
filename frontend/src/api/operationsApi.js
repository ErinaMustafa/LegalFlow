import axiosClient from "./axiosClient";


export const getClients = async () => {
  const response = await axiosClient.get("/clients/");
  return response.data;
};


export const createClient = async (clientData) => {
  const response = await axiosClient.post("/clients/", clientData);
  return response.data;
};


export const updateClient = async (clientId, clientData) => {
  const response = await axiosClient.put(`/clients/${clientId}`, clientData);
  return response.data;
};


export const deleteClient = async (clientId) => {
  const response = await axiosClient.delete(`/clients/${clientId}`);
  return response.data;
};

