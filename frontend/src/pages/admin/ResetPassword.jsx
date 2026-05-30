import { useState } from "react";
import Layout from "../../components/Layout";
import { resetUserPassword } from "../../api/adminApi";


function ResetPassword() {
  const [form, setForm] = useState({
    email: "",
    new_password: ""
  });


  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


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
      email: form.email,
      new_password: form.new_password
    };


    try {
      setError("");
      setSuccess("");


      const data = await resetUserPassword(payload);


      setSuccess(
        data.message || "Password reset successfully"
      );


      setForm({
        email: "",
        new_password: ""
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Failed to reset password"
      );
    }
  };


  return (
    <Layout
      search={search}
      setSearch={setSearch}
      onSearch={handleSearch}
    >
      <div className="page-header">
        <span>ADMINISTRATION</span>
        <h1>Reset Password</h1>
        <p>
          Reset passwords for existing system users.
        </p>
      </div>


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      {success && (
        <div className="success-box">
          {success}
        </div>
      )}


      <div className="dashboard-panel">
        <h2>Reset Password</h2>


        <form
          className="module-form"
          onSubmit={handleSubmit}
        >
          <input
            name="email"
            type="email"
            placeholder="User Email"
            value={form.email}
            onChange={handleChange}
            required
          />


          <input
            name="new_password"
            type="password"
            placeholder="New Password"
            value={form.new_password}
            onChange={handleChange}
            required
          />


          <button type="submit">
            Reset Password
          </button>
        </form>
      </div>
    </Layout>
  );
}


export default ResetPassword;

