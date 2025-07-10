import React, { useState, useEffect } from 'react';
import './Users.css';
import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

function Users() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [editedUser, setEditedUser] = useState({ name: '', email: '', phone: '' });

  const usersCollection = collection(db, 'users');

  // جلب المستخدمين من Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(usersCollection);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    };

    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const addUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.phone) return;

    const docRef = await addDoc(usersCollection, {
      ...newUser,
      createdAt: serverTimestamp()
    });

    setUsers([...users, { id: docRef.id, ...newUser }]);
    setNewUser({ name: '', email: '', phone: '' });
    setShowForm(false);
  };

  const deleteUser = async (id) => {
    await deleteDoc(doc(db, 'users', id));
    setUsers(users.filter((user) => user.id !== id));
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditedUser({ name: user.name, email: user.email, phone: user.phone });
  };

  const saveChanges = async () => {
    const userRef = doc(db, 'users', editingUser.id);
    await updateDoc(userRef, editedUser);

    const updatedUsers = users.map((u) =>
      u.id === editingUser.id ? { ...u, ...editedUser } : u
    );
    setUsers(updatedUsers);
    setEditingUser(null);
  };

  return (
    <div className="users-page">
      <h1>إدارة المستخدمين</h1>

      <button className="add-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'إغلاق النموذج' : '+ إضافة مستخدم'}
      </button>

      {showForm && (
        <div className="form-container">
          <input
            type="text"
            name="name"
            placeholder="الاسم"
            value={newUser.name}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="البريد الإلكتروني"
            value={newUser.email}
            onChange={handleChange}
          />
          <input
            type="tel"
            name="phone"
            placeholder="رقم الموبايل"
            value={newUser.phone}
            onChange={handleChange}
          />
          <button onClick={addUser}>إضافة</button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>id</th>
            <th>الاسم</th>
            <th>البريد الإلكتروني</th>
            <th>رقم الموبايل</th>
            <th>تعديل</th>
            <th>حذف</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id.slice(0, 6)}...</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>
              <td>
                <button className="edit-btn" onClick={() => handleEdit(user)}>✏️ تعديل</button>
              </td>
              <td>
                <button className="delete-btn" onClick={() => deleteUser(user.id)}>🗑 حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser && (
        <div className="edit-modal">
          <div className="modal-content">
            <h3>تعديل المستخدم</h3>
            <input
              type="text"
              value={editedUser.name}
              onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
            />
            <input
              type="email"
              value={editedUser.email}
              onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
            />
            <input
              type="tel"
              value={editedUser.phone}
              onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
            />
            <button onClick={saveChanges}>حفظ</button>
            <button onClick={() => setEditingUser(null)}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
