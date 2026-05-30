import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { getRoles, createSystemUser } from "../../api/adminApi";


function CreateUser() {
  const [roles, setRoles] = useState([]);


  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role_id: ""
  });


  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const loadRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load roles");
    }
  };


  useEffect(() => {
    loadRoles();
  }, []);


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };


  const handleSearch = (e) => {
    e.preventDefault();
  };


  const handleSubmit = async (e) => {
    e.preventDefault();


    const payload = {
      username: form.username,
      email: form.email,
      password: form.password,
      role_id: Number(form.role_id)
    };


    try {
      setError("");
      setSuccess("");


      const data = await createSystemUser(payload);


      setSuccess(data.message || "User created successfully");


      setForm({
        username: "",
        email: "",
        password: "",
        role_id: ""
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create user");
    }
  };


  return (
    <Layout search={search} setSearch={setSearch} onSearch={handleSearch}>
      <div className="page-header">
        <span>ADMINISTRATION</span>
        <h1>Create User</h1>
        <p>Create internal system users and assign roles.</p>
      </div>


      {error && <div className="error-box">{error}</div>}


      {success && (
        <div className="success-box">
          {success}
        </div>
      )}


      <div className="dashboard-panel">
        <h2>Create User</h2>


        <form className="module-form" onSubmit={handleSubmit}>
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
          />


          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />


          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />


          <select
            name="role_id"
            value={form.role_id}
            onChange={handleChange}
            required
          >
            <option value="">Select role</option>


            {roles
              .filter((role) => role.name !== "Client")
              .map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
          </select>


          <button type="submit">Create User</button>
        </form>
      </div>
    </Layout>
  );
}


export default CreateUser;

