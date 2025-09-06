import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  query,
  where,
} from "firebase/firestore";
import "./Trips.css";

function Trips() {
  const [trips, setTrips] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [places, setPlaces] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [filterCity, setFilterCity] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editedSeats, setEditedSeats] = useState(0);
  const [editedDate, setEditedDate] = useState("");
  const [editedDuration, setEditedDuration] = useState(1);

  const [showBookedUsersModal, setShowBookedUsersModal] = useState(false);
  const [bookedUsers, setBookedUsers] = useState([]); // [{userId, name, email, seats}]
  const [loadingBookedUsers, setLoadingBookedUsers] = useState(false);
  const tripsCollection = collection(db, "trips");

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(tripsCollection);
        const tripsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const today = new Date();

        // 1️⃣ الرحلات القديمة التي انتهت
        const pastTrips = tripsData.filter(
          (trip) => trip.tripDate?.toDate() < today
        );

        // 2️⃣ حذف الرحلات القديمة من Firestore
        // 2️⃣ حذف الرحلات القديمة وجميع الحجوزات المرتبطة بها
        for (const trip of pastTrips) {
          try {
            // 🟢 جلب جميع الحجوزات المرتبطة بهذه الرحلة
            const q = query(
              collection(db, "bookings"),
              where("tripId", "==", trip.id)
            );
            const snap = await getDocs(q);

            // 🟢 حذف جميع الحجوزات المرتبطة
            const deleteBookings = snap.docs.map((docSnap) =>
              deleteDoc(doc(db, "bookings", docSnap.id))
            );
            await Promise.all(deleteBookings);

            // 🟢 حذف الرحلة نفسها
            await deleteDoc(doc(db, "trips", trip.id));
          } catch (err) {
            console.error(`فشل حذف الحجوزات أو الرحلة (${trip.id}):`, err);
          }
        }

        // 3️⃣ الاحتفاظ بالرحلات القادمة فقط
        const upcomingTrips = tripsData.filter(
          (trip) => trip.tripDate?.toDate() >= today
        );

        setTrips(upcomingTrips);
      } catch (err) {
        console.error("فشل جلب الرحلات:", err);
        setError("فشل جلب بيانات الرحلات.");
      }
      setLoading(false);
    };

    const fetchCities = async () => {
      try {
        const snapshot = await getDocs(collection(db, "cities"));
        const cityList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCities(cityList);
      } catch (err) {
        console.error("فشل تحميل المدن:", err);
      }
    };

    fetchTrips();
    fetchCities();
  }, []);

  const formatDate = (timestamp) => {
    try {
      return timestamp?.toDate().toLocaleDateString("ar-SY", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getCityNames = (ids) => {
    if (!Array.isArray(ids)) return "";
    return ids
      .map((id) => cities.find((city) => city.id === id)?.name || id)
      .join(", ");
  };

  const fetchCollectionByIds = async (collectionName, ids) => {
    if (!ids || !ids.length) return [];
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs
      .filter((doc) => ids.includes(doc.id))
      .map((doc) => ({ id: doc.id, ...doc.data() }));
  };
  const openBookedUsersModal = async (tripId) => {
    setLoadingBookedUsers(true);
    try {
      // 1) جلب جميع حجوزات هذه الرحلة
      const q = query(
        collection(db, "bookings"),
        where("tripId", "==", tripId)
      );
      const snap = await getDocs(q);
      const bookingsDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 2) تجميع userSeats أو fallback للقديم
      let entries = [];
      bookingsDocs.forEach((b) => {
        if (Array.isArray(b.userSeats) && b.userSeats.length) {
          entries.push(...b.userSeats); // [{userId, seats}]
        } else if (Array.isArray(b.userIds) && b.userIds.length) {
          // توافق خلفي: إذا ما عندي userSeats
          // إن كان عندي seatsBooked نقسمها بالتساوي، وإلا 1 مقعد لكل مستخدم
          const perUser =
            b.seatsBooked && b.userIds.length
              ? Math.max(1, Math.floor(b.seatsBooked / b.userIds.length))
              : 1;
          entries.push(
            ...b.userIds.map((uid) => ({ userId: uid, seats: perUser }))
          );
        }
      });

      // 3) جلب بيانات المستخدمين لعرض الاسم/الإيميل
      const usersSnap = await getDocs(collection(db, "users"));
      const usersMap = Object.fromEntries(
        usersSnap.docs.map((u) => [u.id, { id: u.id, ...u.data() }])
      );

      const merged = entries.map((e) => ({
        userId: e.userId,
        seats: e.seats,
        name: usersMap[e.userId]?.name || e.userId,
        email: usersMap[e.userId]?.email || "",
      }));

      setBookedUsers(merged);
      setShowBookedUsersModal(true);
    } catch (err) {
      console.error("خطأ في جلب الحاجزين:", err);
      alert("فشل جلب الحاجزين");
    } finally {
      setLoadingBookedUsers(false);
    }
  };

  const openDetails = async (trip) => {
    setSelectedTrip(null);
    const [pl, rs, ho, hs] = await Promise.all([
      fetchCollectionByIds("places", trip.selectedPlaceIds),
      fetchCollectionByIds("restaurants", trip.selectedRestaurantIds),
      fetchCollectionByIds("hotels", trip.selectedHotelIds),
      fetchCollectionByIds("hospitals", trip.selectedHospitalIds),
    ]);
    setPlaces(pl);
    setRestaurants(rs);
    setHotels(ho);
    setHospitals(hs);
    setSelectedTrip(trip);
    setEditMode(false);
  };

  const handleDelete = async (tripId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرحلة وجميع حجوزاتها؟"))
      return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // 1. جلب جميع الحجوزات
      const bookingsSnapshot = await getDocs(collection(db, "bookings"));

      // 2. حذف الحجوزات المرتبطة بهذه الرحلة
      const deletePromises = bookingsSnapshot.docs
        .filter((doc) => doc.data().tripId === tripId)
        .map((doc) => deleteDoc(doc.ref));

      await Promise.all(deletePromises);

      // 3. حذف الرحلة
      await deleteDoc(doc(db, "trips", tripId));

      // 4. تحديث الحالة
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      setMessage("✅ تم حذف الرحلة وجميع الحجوزات المرتبطة بها.");
    } catch (err) {
      console.error("فشل في حذف الرحلة أو الحجوزات:", err);
      setError("❌ فشل في حذف الرحلة أو الحجوزات المرتبطة.");
    }

    setLoading(false);
  };

  const handleEdit = (trip) => {
    setEditedSeats(trip.maxSeats);
    setEditedDate(trip.tripDate?.toDate().toISOString().split("T")[0] || "");
    setEditedDuration(trip.tripDuration);
    setSelectedTrip(trip);
    setEditMode(true);
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, "trips", selectedTrip.id), {
        maxSeats: editedSeats,
        tripDate: Timestamp.fromDate(new Date(editedDate)),
        tripDuration: editedDuration,
      });
      setTrips((prev) =>
        prev.map((t) =>
          t.id === selectedTrip.id
            ? {
                ...t,
                maxSeats: editedSeats,
                tripDate: Timestamp.fromDate(new Date(editedDate)),
                tripDuration: editedDuration,
              }
            : t
        )
      );
      setMessage("تم تعديل الرحلة بنجاح.");
      setSelectedTrip(null);
      setEditMode(false);
    } catch (err) {
      console.error("فشل تعديل الرحلة:", err);
      setError("فشل تعديل الرحلة.");
    }
  };

  const filteredTrips = trips
    .filter((trip) => {
      const matchesCity =
        !filterCity || trip.selectedCityIds?.includes(filterCity);
      const matchesDate =
        !filterDate ||
        (trip.tripDate &&
          trip.tripDate.toDate().toISOString().split("T")[0] === filterDate);
      return matchesCity && matchesDate;
    })
    .sort((a, b) => {
      // ترتيب تصاعدي حسب تاريخ الرحلة
      if (!a.tripDate) return 1;
      if (!b.tripDate) return -1;
      return a.tripDate.toDate() - b.tripDate.toDate();
    });

  return (
    <div className="trips-page">
      <h1 className="hhh">إدارة الرحلات</h1>

      {message && <p className="success-msg">{message}</p>}
      {error && <p className="error-msg">{error}</p>}

      <div className="filters">
        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
        >
          <option value="">كل المدن</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>المدن</th>
            <th>تاريخ الرحلة</th>
            <th>المدة</th>
            <th>المقاعد الكلية</th>
            <th>المقاعد المتاحة</th>

            <th>الخيارات</th>
          </tr>
        </thead>
        <tbody>
          {filteredTrips.map((trip) => (
            <tr key={trip.id}>
              <td>{getCityNames(trip.selectedCityIds)}</td>
              <td>{formatDate(trip.tripDate)}</td>
              <td>{trip.tripDuration} يوم</td>
              <td>{trip.maxSeats}</td>
              <td>{trip.maxSeats - (trip.seatsBooked || 0)}</td>

              <td>
                <button className="show-btn" onClick={() => openDetails(trip)}>
                  📄عرض التفاصيل
                </button>
                <button className="edit-btn-l" onClick={() => handleEdit(trip)}>
                  ✏️ تعديل
                </button>
                <button
                  className="delete-btn-l"
                  onClick={() => handleDelete(trip.id)}
                >
                  🗑 حذف
                </button>
                <button
                  className="show-btn"
                  onClick={() => openBookedUsersModal(trip.id)}
                >
                  👥 الحاجزون
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editMode && selectedTrip && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>✏️ تعديل معلومات الرحلة</h3>

            <label>📅 تاريخ الرحلة:</label>
            <input
              type="date"
              value={editedDate}
              onChange={(e) => setEditedDate(e.target.value)}
            />

            <label>⏳ المدة (بالأيام):</label>
            <input
              type="number"
              min="1"
              value={editedDuration}
              onChange={(e) => setEditedDuration(Number(e.target.value))}
            />

            <label>🪑 عدد المقاعد:</label>
            <input
              type="number"
              min="1"
              value={editedSeats}
              onChange={(e) => setEditedSeats(Number(e.target.value))}
            />

            <div className="modal-actions">
              <button className="save-btn" onClick={saveEdit}>
                💾 حفظ التعديل
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setEditMode(false);
                  setSelectedTrip(null);
                }}
              >
                ❌ إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTrip && !editMode && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>تفاصيل الرحلة</h2>
            <p>
              <strong>المدن:</strong>{" "}
              {getCityNames(selectedTrip.selectedCityIds)}
            </p>
            <p>
              <strong>الرحلةتاريخ:</strong> {formatDate(selectedTrip.tripDate)}
            </p>
            <p>
              <strong>المدة:</strong> {selectedTrip.tripDuration} يوم
            </p>
            <p>
              <strong>المقاعد الكلية:</strong> {selectedTrip.maxSeats}
            </p>
            <p>
              <strong>المقاعد المتاحة:</strong>{" "}
              {selectedTrip.availableSeats ?? selectedTrip.maxSeats}
            </p>

            <hr />
            <p>
              <strong>الأماكن السياحية:</strong>{" "}
              {places.map((p) => p.name).join(", ") || "لا يوجد"}
            </p>
            <p>
              <strong>المطاعم:</strong>{" "}
              {restaurants.map((r) => r.name).join(", ") || "لا يوجد"}
            </p>
            <p>
              <strong>الفنادق:</strong>{" "}
              {hotels.map((h) => h.name).join(", ") || "لا يوجد"}
            </p>
            <p>
              <strong>المستشفيات:</strong>{" "}
              {hospitals.map((h) => h.name).join(", ") || "لا يوجد"}
            </p>

            <button onClick={() => setSelectedTrip(null)}>إغلاق</button>
          </div>
        </div>
      )}
      {showBookedUsersModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>👥 قائمة الحاجزين</h3>

            {loadingBookedUsers ? (
              <p>جاري التحميل...</p>
            ) : bookedUsers.length ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>الإيميل</th>
                    <th>المقاعد المحجوزة</th>
                  </tr>
                </thead>
                <tbody>
                  {bookedUsers.map((u, idx) => (
                    <tr key={idx}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.seats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>لا يوجد حجوزات لهذه الرحلة.</p>
            )}

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button
                className="cancel-btn"
                onClick={() => setShowBookedUsersModal(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Trips;
