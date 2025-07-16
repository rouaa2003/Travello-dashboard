// src/pages/ManageEntries.jsx
import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
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
  const [selectedCity, setSelectedCity] = useState(""); // مدينة الفلترة

  const fetchData = async () => {
    const snapshot = await getDocs(collection(db, activeTab));
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setData(docs);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (window.confirm("هل أنت متأكد من الحذف؟")) {
      await deleteDoc(doc(db, activeTab, id));
      fetchData();
    }
  };

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

  const filteredData = data
    .filter((item) => item.name?.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => (selectedCity ? item.cityId === selectedCity : true));

  const cityOptions = [...new Set(data.map((item) => item.cityId))].filter(
    Boolean
  );

  return (
    <div className="manage-page">
      <h2>إدارة البيانات</h2>

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
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

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
