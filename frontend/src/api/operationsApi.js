import axiosClient from "./axiosClient";




export const getClients = async (params = {}) => {
  const response = await axiosClient.get(
    "/clients/",
    { params }
  );


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






export const getTasks = async (params = {}) => {
  const response = await axiosClient.get("/tasks/", { params });
  return response.data;
};


export const createTask = async (taskData) => {
  const response = await axiosClient.post("/tasks/", taskData);
  return response.data;
};


export const updateTask = async (taskId, taskData) => {
  const response = await axiosClient.put(`/tasks/${taskId}`, taskData);
  return response.data;
};


export const deleteTask = async (taskId) => {
  const response = await axiosClient.delete(`/tasks/${taskId}`);
  return response.data;
};






export const getCalendarEvents = async (params = {}) => {
  const response = await axiosClient.get("/calendar-events/", { params });
  return response.data;
};


export const createCalendarEvent = async (eventData) => {
  const response = await axiosClient.post("/calendar-events/", eventData);
  return response.data;
};


export const updateCalendarEvent = async (eventId, eventData) => {
  const response = await axiosClient.put(`/calendar-events/${eventId}`, eventData);
  return response.data;
};


export const deleteCalendarEvent = async (eventId) => {
  const response = await axiosClient.delete(`/calendar-events/${eventId}`);
  return response.data;
};




export const getAppointments = async (params = {}) => {
  const response = await axiosClient.get("/appointments/", { params });
  return response.data;
};


export const createAppointment = async (appointmentData) => {
  const response = await axiosClient.post("/appointments/", appointmentData);
  return response.data;
};


export const updateAppointment = async (appointmentId, appointmentData) => {
  const response = await axiosClient.put(
    `/appointments/${appointmentId}`,
    appointmentData
  );
  return response.data;
};


export const deleteAppointment = async (appointmentId) => {
  const response = await axiosClient.delete(`/appointments/${appointmentId}`);
  return response.data;
};

export const getReminders = async (params = {}) => {
  const response = await axiosClient.get("/reminders/", { params });
  return response.data;
};

export const createReminder = async (reminderData) => {
  const response = await axiosClient.post("/reminders/", reminderData);
  return response.data;
};

export const updateReminder = async (reminderId, reminderData) => {
  const response = await axiosClient.put(`/reminders/${reminderId}`, reminderData);
  return response.data;
};

export const deleteReminder = async (reminderId) => {
  const response = await axiosClient.delete(`/reminders/${reminderId}`);
  return response.data;
};


export const getComments = async () => {
  const response = await axiosClient.get("/comments/");
  return response.data;
};

export const createComment = async (commentData) => {
  const response = await axiosClient.post("/comments/", commentData);
  return response.data;
};

export const updateComment = async (commentId, commentData) => {
  const response = await axiosClient.put(`/comments/${commentId}`, commentData);
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await axiosClient.delete(`/comments/${commentId}`);
  return response.data;
};




export const createNotification = async (notificationData) => {
  const response = await axiosClient.post("/notifications/", notificationData);
  return response.data;
};

export const getNotifications = async (params = {}) => {
  const response = await axiosClient.get("/notifications/", { params });
  return response.data;
};

export const updateNotification = async (notificationId, notificationData) => {
  const response = await axiosClient.put(
    `/notifications/${notificationId}`,
    notificationData
  );
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await axiosClient.delete(`/notifications/${notificationId}`);
  return response.data;
};

