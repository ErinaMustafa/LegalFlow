import { useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
}

export default App;