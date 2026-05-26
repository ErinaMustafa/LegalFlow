import { createContext, useContext, useState } from "react";
import { loginUser } from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  const login = async (email, password) => {
    const data = await loginUser({
      email,
      password
    });

    sessionStorage.setItem(
      "token",
      data.access_token
    );

    sessionStorage.setItem(
      "user",
      JSON.stringify(data)
    );

    setUser(data);

    return data;
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);