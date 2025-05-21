// src/components/Logout.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      localStorage.removeItem(`tableData_${userId}`);
      localStorage.removeItem(`excelFile_${userId}`);
      localStorage.removeItem(`patterns_${userId}`);
    }
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }, [navigate]);

  return <div>Выход...</div>;
};

export default Logout;
