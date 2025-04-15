// Login.jsx (пример)
import React, { useState } from "react";
import { useLoginMutation } from "../features/auth/authApi";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [login, { isLoading }] = useLoginMutation();
  const [formData, setFormData] = useState({ usernameOrEmail: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(formData).unwrap();
      console.log("Ответ сервера при логине:", result);
      // Предположим, сервер возвращает { message, token, user: { id, username, email } }
      localStorage.setItem("token", result.token);
      localStorage.setItem("userId", result.user.id);
      // Возможно, хотите ещё сохранить user.username
      // Перенаправить на главную или dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Ошибка входа:", err);
    }
  };

  return (
    <div>
      <h1>Вход</h1>
      <form onSubmit={handleSubmit}>
        <label>Имя пользователя или Email:
          <input
            type="text"
            name="usernameOrEmail"
            value={formData.usernameOrEmail}
            onChange={handleChange}
            required
          />
        </label>
        <label>Пароль:
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit" disabled={isLoading}>Войти</button>
      </form>
    </div>
  );
};

export default Login;
