import React, { useState, useEffect, useRef } from "react";
import "./MultiSelectDropdown.css";
const MultiSelectDropdown = ({ options, selectedOptions, onChange }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();
  const [search, setSearch] = useState("");
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(search.toLowerCase())
  );

  // إغلاق القائمة لما تنقر برّا
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (id) => {
    if (selectedOptions.includes(id)) {
      onChange(selectedOptions.filter((opt) => opt !== id));
    } else {
      onChange([...selectedOptions, id]);
    }
  };

  return (
    <div className="multi-select-dropdown" ref={dropdownRef}>
      <input
        type="text"
        placeholder="🔍 ابحث عن مدينة..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />

      <button className="dropdown-btn" onClick={() => setOpen(!open)}>
        {selectedOptions.length === 0
          ? "اختر مدينة أو أكثر"
          : `تم الاختيار (${selectedOptions.length})`}
        <span className={`arrow ${open ? "open" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="dropdown-list">
          {filteredOptions.map((option) => (
            <div
              key={option.id}
              className={`dropdown-item ${
                selectedOptions.includes(option.id) ? "selected" : ""
              }`}
              onClick={() => toggleOption(option.id)}
            >
              <img
                src={option.imgUrl || "https://via.placeholder.com/40"}
                alt={option.name}
                className="city-img"
              />
              <span>{option.name}</span>
              {selectedOptions.includes(option.id) && (
                <span className="check">✔</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
