// الملف المعدل: Users.js

import React, { useState, useEffect } from "react";
import "./Users.css";
import { db, auth } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
} from "firebase/auth";

function Users() {
  const [users, setUsers] = useState([]);
  const [cities, setCities] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    cityId: "",
  });
  const [editingUser, setEditingUser] = useState(null);
  const [editedUser, setEditedUser] = useState({
    name: "",
    email: "",
    cityId: "",
    isAdmin: false,
    oldPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const usersCollection = collection(db, "users");
  const citiesCollection = collection(db, "cities");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(usersCollection);
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    } catch (err) {
      setError("فشل جلب بيانات المستخدمين.");
    }
    setLoading(false);
  };

  const fetchCities = async () => {
    try {
      const snapshot = await getDocs(citiesCollection);
      const citiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCities(citiesData);
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
    fetchCities();
  }, []);

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const addUser = async () => {
    setMessage("");
    setError("");

    if (
      !newUser.name ||
      !newUser.email ||
      !newUser.cityId ||
      !newUser.password
    ) {
      setError("جميع الحقول مطلوبة.");
      return;
    }

    if (!isValidEmail(newUser.email)) {
      setError("يرجى إدخال بريد إلكتروني صالح.");
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();

      // 1. إنشاء المستخدم في Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      const uid = userCredential.user.uid;

      // 2. حفظ بيانات المستخدم في Firestore
      const docRef = await addDoc(usersCollection, {
        uid,
        name: newUser.name,
        email: newUser.email,
        cityId: newUser.cityId,
        isAdmin: false,
        createdAt: serverTimestamp(),
      });

      // 3. تحديث الواجهة
      setUsers([
        ...users,
        {
          id: docRef.id,
          uid,
          name: newUser.name,
          email: newUser.email,
          cityId: newUser.cityId,
          isAdmin: false,
        },
      ]);

      setNewUser({ name: "", email: "", password: "", cityId: "" });
      setShowForm(false);
      setMessage("✅ تم إنشاء المستخدم وتسجيله بنجاح.");
    } catch (err) {
      console.error("فشل إضافة المستخدم:", err);
      setError(
        "❌ فشل إنشاء المستخدم. قد يكون البريد الإلكتروني مستخدم مسبقًا."
      );
    }

    setLoading(false);
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المستخدم وجميع حجوزاته؟"))
      return;
    setLoading(true);
    try {
      const bookingsSnapshot = await getDocs(collection(db, "bookings"));
      const affectedBookings = bookingsSnapshot.docs.filter((doc) =>
        (doc.data().userIds || []).includes(userId)
      );
      const promises = affectedBookings.map(async (bookingDoc) => {
        const data = bookingDoc.data();
        const updatedUserIds = (data.userIds || []).filter(
          (id) => id !== userId
        );
        if (updatedUserIds.length === 0) {
          await deleteDoc(doc(db, "bookings", bookingDoc.id));
        } else {
          await updateDoc(doc(db, "bookings", bookingDoc.id), {
            userIds: updatedUserIds,
          });
        }
      });
      await Promise.all(promises);
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter((user) => user.id !== userId));
      setMessage("تم حذف المستخدم وجميع الحجوزات المرتبطة به.");
    } catch {
      setError("فشل حذف المستخدم أو تعديل الحجوزات.");
    }
    setLoading(false);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditedUser({
      name: user.name,
      email: user.email,
      cityId: user.cityId || "",
      isAdmin: user.isAdmin || false,
      oldPassword: "",
      newPassword: "",
    });
    setMessage("");
    setError("");
  };

  const saveChanges = async () => {
    setMessage("");
    setError("");
    if (!editedUser.name || !editedUser.email || !editedUser.cityId)
      return setError("جميع الحقول مطلوبة.");
    if (!isValidEmail(editedUser.email))
      return setError("يرجى إدخال بريد إلكتروني صالح.");

    setLoading(true);
    try {
      // تغيير كلمة السر فقط إذا كان المستخدم الحالي هو نفسه
      if (
        editedUser.newPassword &&
        editedUser.oldPassword &&
        auth.currentUser?.uid === editingUser.id
      ) {
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          editedUser.oldPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, editedUser.newPassword);
      }

      const { oldPassword, newPassword, ...userDataToUpdate } = editedUser;
      await updateDoc(doc(db, "users", editingUser.id), userDataToUpdate);
      const updatedUsers = users.map((u) =>
        u.id === editingUser.id ? { ...u, ...userDataToUpdate } : u
      );
      setUsers(updatedUsers);
      setEditingUser(null);
      setMessage("تم تحديث بيانات المستخدم بنجاح.");
    } catch (err) {
      setError("فشل تعديل المستخدم أو كلمة السر. تأكد من صحة كلمة السر.");
    }
    setLoading(false);
  };

  const getCityName = (cityId) =>
    cities.find((c) => c.id === cityId)?.name || "-";

  return (
    <div className="users-page">
      <h1>إدارة المستخدمين</h1>

      <button
        className="add-btn"
        onClick={() => {
          setShowForm(!showForm);
          setMessage("");
          setError("");
        }}
        disabled={loading}
      >
        {showForm ? "إغلاق النموذج" : "+ إضافة مستخدم"}
      </button>

      {message && <p className="success-msg">{message}</p>}
      {error && <p className="error-msg">{error}</p>}

      {showForm && (
        <div className="form-container">
          <input
            type="text"
            name="name"
            placeholder="الاسم"
            value={newUser.name}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            type="email"
            name="email"
            placeholder="البريد الإلكتروني"
            value={newUser.email}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="كلمة السر"
            value={newUser.password}
            onChange={handleChange}
            disabled={loading}
          />

          <select
            className="select-city"
            name="cityId"
            value={newUser.cityId}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">اختر المدينة</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          <button onClick={addUser} disabled={loading}>
            {loading ? "جاري الإضافة..." : "إضافة"}
          </button>
        </div>
      )}

      {loading && !showForm && <p>...جاري تحميل البيانات</p>}

      <table>
        <thead>
          <tr>
            <th>id</th>
            <th>الاسم</th>
            <th>البريد الإلكتروني</th>
            <th>المدينة</th>
            <th>مشرف</th>
            <th>تعديل</th>
            <th>حذف</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && !loading && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                لا توجد بيانات للمستخدمين
              </td>
            </tr>
          )}
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id.slice(0, 6)}...</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{getCityName(user.cityId)}</td>
              <td>{user.isAdmin ? "نعم" : "لا"}</td>
              <td>
                <button
                  className="edit-btn"
                  onClick={() => handleEdit(user)}
                  disabled={loading}
                >
                  ✏️ تعديل
                </button>
              </td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => deleteUser(user.id)}
                  disabled={loading}
                >
                  🗑 حذف
                </button>
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
              onChange={(e) =>
                setEditedUser({ ...editedUser, name: e.target.value })
              }
              disabled={loading}
            />
            <input
              type="email"
              value={editedUser.email}
              onChange={(e) =>
                setEditedUser({ ...editedUser, email: e.target.value })
              }
              disabled={loading}
            />
            <select
              value={editedUser.cityId}
              onChange={(e) =>
                setEditedUser({ ...editedUser, cityId: e.target.value })
              }
              disabled={loading}
            >
              <option value="">اختر المدينة</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>

            {/* فقط إذا كان المستخدم هو نفسه */}
            {auth.currentUser?.uid === editingUser.id && (
              <>
                <input
                  type="password"
                  placeholder="كلمة السر الحالية"
                  value={editedUser.oldPassword}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      oldPassword: e.target.value,
                    })
                  }
                  disabled={loading}
                />
                <input
                  type="password"
                  placeholder="كلمة السر الجديدة (اختياري)"
                  value={editedUser.newPassword}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      newPassword: e.target.value,
                    })
                  }
                  disabled={loading}
                />
              </>
            )}

            <div style={{ margin: "15px 0", textAlign: "right" }}>
              <label className="lll">
                <input
                  type="checkbox"
                  checked={editedUser.isAdmin}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, isAdmin: e.target.checked })
                  }
                  disabled={loading}
                />{" "}
                مشرف (Admin)
              </label>
            </div>

            {error && <p className="error-msg">{error}</p>}
            {message && <p className="success-msg">{message}</p>}

            <button
              onClick={saveChanges}
              disabled={loading}
              className="save-btn"
            >
              {loading ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button
              onClick={() => setEditingUser(null)}
              disabled={loading}
              className="cancel-btn"
              style={{ marginLeft: "10px" }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
