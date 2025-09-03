// src/pages/ManageEntries.jsx
import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import "./ManageEntries.css";

const collections = [
  { key: "places", label: "أماكن مشهورة" },
  { key: "restaurants", label: "مطاعم" },
  { key: "hospitals", label: "مشافي" },
  { key: "hotels", label: "فنادق" },
];

function ManageEntries() {
  const [activeTab, setActiveTab] = useState("places");
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [selectedCity, setSelectedCity] = useState(""); // فلترة المدينة
  const [showAddModal, setShowAddModal] = useState(false);
  const [cities, setCities] = useState([]);

  const [newEntry, setNewEntry] = useState({
    name: "",
    type: "places",
    description: "",
    imgUrl: "",
    cityId: "",
    isPopular: false,
  });

  // جلب بيانات العناصر
  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, activeTab));
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setData(docs);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // جلب المدن
  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    const snapshot = await getDocs(collection(db, "cities"));
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setCities(docs);
    // تعيين أول مدينة كقيمة افتراضية
    if (docs[0]) setNewEntry((prev) => ({ ...prev, cityId: docs[0].id }));
  };

  // الحذف
  const handleDelete = async (id) => {
    if (window.confirm("هل أنت متأكد من الحذف؟")) {
      await deleteDoc(doc(db, activeTab, id));
      fetchData();
    }
  };

  // التعديل
  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditValues({ ...item });
  };

  const handleSave = async () => {
    const ref = doc(db, activeTab, editingId);
    await updateDoc(ref, editValues);
    setEditingId(null);
    fetchData();
  };

  // الإضافة
  const handleAddEntry = async () => {
    if (!newEntry.name || !newEntry.description || !newEntry.cityId) {
      alert("يرجى ملء جميع الحقول المطلوبة!");
      return;
    }

    try {
      await addDoc(collection(db, newEntry.type), {
        name: newEntry.name,
        description: newEntry.description,
        imgUrl: newEntry.imgUrl,
        cityId: newEntry.cityId,
        isPopular: newEntry.isPopular,
      });
      alert(
        `✅ تم إضافة عنصر جديد إلى ${
          collections.find((c) => c.key === newEntry.type)?.label
        }`
      );
      setShowAddModal(false);
      setNewEntry({
        type: "places",
        name: "",
        description: "",
        imgUrl: "",
        cityId: cities[0]?.id || "",
        isPopular: false,
      });

      if (newEntry.type === activeTab) fetchData();
    } catch (error) {
      console.error("❌ خطأ في الإضافة:", error);
      alert("❌ فشل في الإضافة، تحقق من الاتصال أو البيانات.");
    }
  };

  const filteredData = data
    .filter((item) => item.name?.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => (selectedCity ? item.cityId === selectedCity : true));

  return (
    <div className="manage-page">
      <h2>إدارة البيانات</h2>

      {/* Tabs */}
      <div className="tabs">
        {collections.map((col) => (
          <button
            key={col.key}
            className={activeTab === col.key ? "active" : ""}
            onClick={() => setActiveTab(col.key)}
          >
            {col.label}
          </button>
        ))}
      </div>

      {/* Filters + زر الإضافة */}
      <div className="filters">
        <input
          type="text"
          placeholder="🔍 ابحث باسم العنصر..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="f-select"
        >
          <option value="">كل المحافظات</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowAddModal(true)}
          className="add-btn myadd"
          style={{ marginLeft: "10px" }}
        >
          إضافة عنصر جديد +
        </button>
      </div>

      {/* مودال الإضافة */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>إضافة عنصر جديد</h3>

            {/* اختيار نوع العنصر */}
            <label className="wide">
              <select
                value={newEntry.type}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, type: e.target.value })
                }
              >
                {collections.map((col) => (
                  <option key={col.key} value={col.key}>
                    {col.label}
                  </option>
                ))}
              </select>
            </label>

            <input
              placeholder="الاسم"
              value={newEntry.name}
              onChange={(e) =>
                setNewEntry({ ...newEntry, name: e.target.value })
              }
            />
            <textarea
              placeholder="الوصف"
              value={newEntry.description}
              onChange={(e) =>
                setNewEntry({ ...newEntry, description: e.target.value })
              }
            />
            <input
              placeholder="رابط الصورة"
              value={newEntry.imgUrl}
              onChange={(e) =>
                setNewEntry({ ...newEntry, imgUrl: e.target.value })
              }
            />
            <select
              value={newEntry.cityId}
              onChange={(e) =>
                setNewEntry({ ...newEntry, cityId: e.target.value })
              }
            >
              <option value="">اختر المحافظة</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>

            <label>
              <input
                type="checkbox"
                checked={newEntry.isPopular}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, isPopular: e.target.checked })
                }
              />
              شائع؟
            </label>

            <div className="form-actions">
              <button onClick={handleAddEntry} className="btn save">
                إضافة ✅
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="btn cancel"
              >
                إلغاء ❌
              </button>
            </div>
          </div>
        </div>
      )}

      {/* جدول البيانات */}
      <table className="entries-table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الوصف</th>
            <th>الصورة</th>
            <th>المحافظة</th>
            <th>شائع؟</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item) => (
            <tr key={item.id}>
              <td>
                {editingId === item.id ? (
                  <input
                    value={editValues.name || ""}
                    onChange={(e) =>
                      setEditValues({ ...editValues, name: e.target.value })
                    }
                  />
                ) : (
                  item.name
                )}
              </td>
              <td>
                {editingId === item.id ? (
                  <textarea
                    value={editValues.description || ""}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        description: e.target.value,
                      })
                    }
                  />
                ) : (
                  item.description?.slice(0, 50) + "..."
                )}
              </td>
              <td>
                {editingId === item.id ? (
                  <input
                    value={editValues.imgUrl || ""}
                    onChange={(e) =>
                      setEditValues({ ...editValues, imgUrl: e.target.value })
                    }
                  />
                ) : (
                  <img src={item.imgUrl} alt="img" className="thumb" />
                )}
              </td>
              <td>
                {editingId === item.id ? (
                  <input
                    value={editValues.cityId || ""}
                    onChange={(e) =>
                      setEditValues({ ...editValues, cityId: e.target.value })
                    }
                  />
                ) : (
                  item.cityId
                )}
              </td>
              <td>
                {editingId === item.id ? (
                  <input
                    type="checkbox"
                    checked={editValues.isPopular || false}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        isPopular: e.target.checked,
                      })
                    }
                  />
                ) : item.isPopular ? (
                  "✅"
                ) : (
                  "❌"
                )}
              </td>
              <td>
                {editingId === item.id ? (
                  <>
                    <button onClick={handleSave} className="btn save">
                      💾
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn cancel"
                    >
                      ❌
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(item)}
                      className="btn edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn delete"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManageEntries;
