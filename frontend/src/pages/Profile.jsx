import React, { useEffect, useState } from 'react';

const Profile = () => {
  const [user, setUser] = useState(null);

  // При монтировании пытаемся получить данные текущего пользователя из localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  if (!user) {
    return <p>Пожалуйста, войдите в систему</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Профиль пользователя</h1>
      <p><strong>ID:</strong> {user.id}</p>
      <p><strong>Имя пользователя:</strong> {user.username}</p>
      <p><strong>Email:</strong> {user.email}</p>
    </div>
  );
};

export default Profile;
