"use client";

import { useState, useEffect } from "react";

export default function FilterBar({ records, onFilterChange }) {
  const [filters, setFilters] = useState({
    streamerName: "",
    platform: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  // ดึงรายการ unique สำหรับ dropdown (trim เพื่อป้องกัน whitespace)
  const uniqueStreamers = [
    ...new Set(
      records
        .map((r) => (r.streamerName ? String(r.streamerName).trim() : ""))
        .filter(Boolean)
    ),
  ].sort();
  const uniquePlatforms = [
    ...new Set(
      records
        .map((r) => (r.platform ? String(r.platform).trim() : ""))
        .filter(Boolean)
    ),
  ].sort();

  useEffect(() => {
    onFilterChange(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };
    setFilters(newFilters);
    // ส่งค่าไปทันทีเมื่อเปลี่ยน
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      streamerName: "",
      platform: "",
      dateFrom: "",
      dateTo: "",
      search: "",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  return (
    <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          กรองข้อมูล
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Search */}
        <div className="xl:col-span-2">
          <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            ค้นหา
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="ค้นหาทุกฟิลด์..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {/* ชื่อผู้ไลฟ์ */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            ชื่อผู้ไลฟ์
          </label>
          <select
            value={filters.streamerName}
            onChange={(e) => handleFilterChange("streamerName", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">ทั้งหมด</option>
            {uniqueStreamers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Platform */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Platform
          </label>
          <select
            value={filters.platform}
            onChange={(e) => handleFilterChange("platform", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">ทั้งหมด</option>
            {uniquePlatforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>

        {/* วันที่จาก */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            วันที่จาก
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {/* วันที่ถึง */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            วันที่ถึง
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>
    </div>
  );
}

