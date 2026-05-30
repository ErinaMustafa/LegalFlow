import axiosClient from "./axiosClient";


// USERS
export const createSystemUser = async (userData) => {
  const response = await axiosClient.post("/admin/create-user", userData);
  return response.data;
};


export const resetUserPassword = async (passwordData) => {
  const response = await axiosClient.put("/admin/reset-password", passwordData);
  return response.data;
};


// ROLES
export const getRoles = async (params = {}) => {
  const response = await axiosClient.get("/roles/", { params });
  return response.data;
};


export const createRole = async (roleData) => {
  const response = await axiosClient.post("/roles/", roleData);
  return response.data;
};


export const updateRole = async (roleId, roleData) => {
  const response = await axiosClient.put(`/roles/${roleId}`, roleData);
  return response.data;
};


export const deleteRole = async (roleId) => {
  const response = await axiosClient.delete(`/roles/${roleId}`);
  return response.data;
};


// DEPARTMENTS
export const getDepartments = async (params = {}) => {
  const response = await axiosClient.get("/departments/", { params });
  return response.data;
};


export const createDepartment = async (departmentData) => {
  const response = await axiosClient.post("/departments/", departmentData);
  return response.data;
};


export const updateDepartment = async (departmentId, departmentData) => {
  const response = await axiosClient.put(
    `/departments/${departmentId}`,
    departmentData
  );
  return response.data;
};


export const deleteDepartment = async (departmentId) => {
  const response = await axiosClient.delete(`/departments/${departmentId}`);
  return response.data;
};


// PRACTICE AREAS
export const getPracticeAreas = async (params = {}) => {
  const response = await axiosClient.get("/practice-areas/", { params });
  return response.data;
};


export const createPracticeArea = async (practiceAreaData) => {
  const response = await axiosClient.post("/practice-areas/", practiceAreaData);
  return response.data;
};


export const updatePracticeArea = async (practiceAreaId, practiceAreaData) => {
  const response = await axiosClient.put(
    `/practice-areas/${practiceAreaId}`,
    practiceAreaData
  );
  return response.data;
};


export const deletePracticeArea = async (practiceAreaId) => {
  const response = await axiosClient.delete(`/practice-areas/${practiceAreaId}`);
  return response.data;
};
export const getUsers = async () => {
  const response = await axiosClient.get("/admin/users");
  return response.data;
};


export const updateUser = async (userId, userData) => {
  const response = await axiosClient.put(`/admin/users/${userId}`, userData);
  return response.data;
};


export const deleteUser = async (userId) => {
  const response = await axiosClient.delete(`/admin/users/${userId}`);
  return response.data;
};



