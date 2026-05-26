import axiosClient from "./axiosClient";

export const loginUser = async (data) => {
  const response = await axiosClient.post("/auth/login", data);
  return response.data;
};