import axiosClient from "./axiosClient";

// INVOICES
export const getInvoices = async (params = {}) => {
  const response = await axiosClient.get("/invoices/", { params });
  return response.data;
};

export const createInvoice = async (invoiceData) => {
  const response = await axiosClient.post("/invoices/", invoiceData);
  return response.data;
};

export const updateInvoice = async (invoiceId, invoiceData) => {
  const response = await axiosClient.put(`/invoices/${invoiceId}`, invoiceData);
  return response.data;
};

export const deleteInvoice = async (invoiceId) => {
  const response = await axiosClient.delete(`/invoices/${invoiceId}`);
  return response.data;
};

// PAYMENTS

export const getPayments = async (params = {}) => {
  const response = await axiosClient.get("/payments/", { params });
  return response.data;
};

export const createPayment = async (paymentData) => {
  const response = await axiosClient.post("/payments/", paymentData);
  return response.data;
};

export const updatePayment = async (paymentId, paymentData) => {
  const response = await axiosClient.put(
    `/payments/${paymentId}`,
    paymentData
  );
  return response.data;
};

export const deletePayment = async (paymentId) => {
  const response = await axiosClient.delete(`/payments/${paymentId}`);
  return response.data;
};

// EXPENSES

export const getExpenses = async (params = {}) => {
  const response = await axiosClient.get("/expenses/", { params });
  return response.data;
};

export const createExpense = async (expenseData) => {
  const response = await axiosClient.post("/expenses/", expenseData);
  return response.data;
};

export const updateExpense = async (expenseId, expenseData) => {
  const response = await axiosClient.put(`/expenses/${expenseId}`, expenseData);
  return response.data;
};

export const deleteExpense = async (expenseId) => {
  const response = await axiosClient.delete(`/expenses/${expenseId}`);
  return response.data;
};

// TIME ENTRIES

export const getTimeEntries = async (params = {}) => {
  const response = await axiosClient.get("/time-entries/", { params });
  return response.data;
};

export const createTimeEntry = async (timeEntryData) => {
  const response = await axiosClient.post(
    "/time-entries/",
    timeEntryData
  );
  return response.data;
};

export const updateTimeEntry = async (
  timeEntryId,
  timeEntryData
) => {
  const response = await axiosClient.put(
    `/time-entries/${timeEntryId}`,
    timeEntryData
  );
  return response.data;
};

export const deleteTimeEntry = async (timeEntryId) => {
  const response = await axiosClient.delete(
    `/time-entries/${timeEntryId}`
  );
  return response.data;
};


