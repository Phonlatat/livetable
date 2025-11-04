"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import LiveTable from "./components/LiveTable";
import LiveForm from "./components/LiveForm";
import ImportExcel from "./components/ImportExcel";
import FilterBar from "./components/FilterBar";
import ProfileSelector from "./components/ProfileSelector";
import {
  getAllLiveRecords,
  addLiveRecord,
  updateLiveRecord,
  deleteLiveRecord,
  deleteAllLiveRecords,
  getCurrentProfile,
  getProfileStats,
} from "./lib/data";

export default function Home() {
  const [currentProfileId, setCurrentProfileId] = useState(() => {
    const current = getCurrentProfile();
    return current ? current.id : null;
  });
  const [currentProfile, setCurrentProfile] = useState(() => {
    return getCurrentProfile();
  });

  // โหลดข้อมูลตั้งต้นตามโปรไฟล์
  const [records, setRecords] = useState(() => {
    const profileId = getCurrentProfile()?.id || null;
    const data = getAllLiveRecords(profileId);
    // เรียงลำดับตามวันที่ไลฟ์ (date) จากเก่าไปใหม่
    return data.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateA - dateB; // เก่าก่อน
    });
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [filters, setFilters] = useState({
    streamerName: "",
    platform: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  const loadRecords = useCallback(() => {
    const data = getAllLiveRecords(currentProfileId);
    // เรียงลำดับตามวันที่ไลฟ์ (date) จากเก่าไปใหม่
    const sorted = data.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateA - dateB; // เก่าก่อน
    });
    setRecords(sorted);
  }, [currentProfileId]);

  // Reload records เมื่อเปลี่ยนโปรไฟล์
  useEffect(() => {
    // ใช้ setTimeout เพื่อหลีกเลี่ยง cascading renders
    const timer = setTimeout(() => {
      const data = getAllLiveRecords(currentProfileId);
      const sorted = data.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateA - dateB; // เก่าก่อน
      });
      setRecords(sorted);

      const profile = currentProfileId ? getCurrentProfile() : null;
      setCurrentProfile(profile);
    }, 0);

    return () => clearTimeout(timer);
  }, [currentProfileId]);

  const handleProfileChange = useCallback((profileId) => {
    setCurrentProfileId(profileId);
    if (profileId) {
      const profile = getCurrentProfile();
      setCurrentProfile(profile);
    } else {
      setCurrentProfile(null);
    }
    // Reset filters เมื่อเปลี่ยนโปรไฟล์
    setFilters({
      streamerName: "",
      platform: "",
      dateFrom: "",
      dateTo: "",
      search: "",
    });
  }, []);

  const handleAddClick = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    deleteLiveRecord(id, currentProfileId);
    loadRecords();
  };

  const handleSave = (id, formData) => {
    if (id) {
      // แก้ไขข้อมูล
      updateLiveRecord(id, formData, currentProfileId);
    } else {
      // เพิ่มข้อมูลใหม่
      addLiveRecord(formData, currentProfileId);
    }
    loadRecords();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRecord(null);
  };

  const handleImportComplete = () => {
    loadRecords();
  };

  // ฟังก์ชันกรองข้อมูล
  const filteredRecords = useMemo(() => {
    if (
      !filters.streamerName &&
      !filters.platform &&
      !filters.dateFrom &&
      !filters.dateTo &&
      !filters.search
    ) {
      return records;
    }

    return records.filter((record) => {
      // กรองตามชื่อผู้ไลฟ์ (trim ทั้งสองฝั่งเพื่อป้องกัน whitespace)
      if (filters.streamerName) {
        const recordName = String(record.streamerName || "").trim();
        const filterName = String(filters.streamerName).trim();
        if (recordName !== filterName) {
          return false;
        }
      }

      // กรองตาม Platform (trim ทั้งสองฝั่งเพื่อป้องกัน whitespace)
      if (filters.platform) {
        const recordPlatform = String(record.platform || "").trim();
        const filterPlatform = String(filters.platform).trim();
        if (recordPlatform !== filterPlatform) {
          return false;
        }
      }

      // กรองตามวันที่
      if (filters.dateFrom || filters.dateTo) {
        const recordDate = record.date ? new Date(record.date) : null;
        if (!recordDate || isNaN(recordDate.getTime())) {
          return false;
        }

        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (recordDate < fromDate) {
            return false;
          }
        }

        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999); // ถึงสิ้นวัน
          if (recordDate > toDate) {
            return false;
          }
        }
      }

      // ค้นหาทุกฟิลด์
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchFields = [
          record.streamerName,
          record.platform,
          record.date,
          record.startTime,
          record.endTime,
          record.duration,
          record.customerReach,
          record.likes,
          record.orders,
          record.totalAmount,
          record.addToCart,
          record.shares,
          record.notes,
        ];

        const found = searchFields.some((field) => {
          if (!field) return false;
          return String(field).toLowerCase().includes(searchLower);
        });

        if (!found) {
          return false;
        }
      }

      return true;
    });
  }, [records, filters]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleDeleteAll = () => {
    if (records.length === 0) {
      alert("ไม่มีข้อมูลให้ลบ");
      return;
    }

    const confirmMessage = `คุณแน่ใจหรือไม่ที่จะลบข้อมูลทั้งหมด ${records.length} รายการ?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้!`;

    if (confirm(confirmMessage)) {
      const secondConfirm = confirm(
        `⚠️ คำเตือนสุดท้าย!\n\nคุณกำลังจะลบข้อมูลทั้งหมด ${records.length} รายการ\n\nกด "ตกลง" เพื่อลบ หรือ "ยกเลิก" เพื่อยกเลิก`
      );

      if (secondConfirm) {
        const success = deleteAllLiveRecords(currentProfileId);
        if (success) {
          loadRecords();
          alert("ลบข้อมูลทั้งหมดสำเร็จ");
        } else {
          alert("เกิดข้อผิดพลาดในการลบข้อมูล");
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-black">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Selector */}
        <ProfileSelector onProfileChange={handleProfileChange} />

        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
              สถิติการไลฟ์สตรีม
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              {currentProfile
                ? `โปรไฟล์: ${currentProfile.name}`
                : "กรุณาเลือกโปรไฟล์"}
            </p>
            {currentProfile && currentProfile.description && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                {currentProfile.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAddClick}
              disabled={!currentProfileId}
              className="flex items-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-blue-900/50 dark:hover:shadow-blue-900/50"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              เพิ่มข้อมูลการไลฟ์
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 rounded-lg border-2 border-zinc-300 bg-white px-6 py-3 font-semibold text-zinc-900 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Import จาก Excel
            </button>
            {records.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 rounded-lg border-2 border-red-300 bg-white px-6 py-3 font-semibold text-red-600 transition-colors hover:border-red-400 hover:bg-red-50 dark:border-red-700 dark:bg-zinc-900 dark:text-red-400 dark:hover:border-red-600 dark:hover:bg-red-900/20"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                ลบข้อมูลทั้งหมด
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        {currentProfileId && records.length > 0 && (
          <FilterBar records={records} onFilterChange={handleFilterChange} />
        )}

        {/* Stats Summary */}
        {currentProfileId && records.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                จำนวนการไลฟ์ทั้งหมด
              </div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
                {filteredRecords.length}
                {filteredRecords.length !== records.length && (
                  <span className="ml-2 text-base font-normal text-zinc-500 dark:text-zinc-400">
                    / {records.length}
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                จำนวนผู้ไลฟ์
              </div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
                {new Set(filteredRecords.map((r) => r.streamerName)).size}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                ยอดสั่งซื้อรวม
              </div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
                {filteredRecords
                  .reduce((sum, r) => {
                    const orders = parseInt(r.orders) || 0;
                    return sum + orders;
                  }, 0)
                  .toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                ยอดรวมทั้งหมด
              </div>
              <div className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
                {filteredRecords
                  .reduce((sum, r) => {
                    // ถ้าเป็นตัวเลขอยู่แล้ว ใช้ตรงๆ
                    if (typeof r.totalAmount === "number") {
                      return sum + (isNaN(r.totalAmount) ? 0 : r.totalAmount);
                    }
                    // ถ้าเป็น string ลองแปลงเป็นตัวเลข
                    const amount = parseFloat(
                      String(r.totalAmount || "0").replace(/,/g, "")
                    );
                    return sum + (isNaN(amount) ? 0 : amount);
                  }, 0)
                  .toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {currentProfileId ? (
          <LiveTable
            records={filteredRecords}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-600 dark:text-zinc-400">
              กรุณาเลือกโปรไฟล์เพื่อดูข้อมูล
            </p>
          </div>
        )}

        {/* Form Modal */}
        <LiveForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSave={handleSave}
          initialData={editingRecord}
        />

        {/* Import Excel Modal */}
        <ImportExcel
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImportComplete={handleImportComplete}
        />
      </main>
    </div>
  );
}
