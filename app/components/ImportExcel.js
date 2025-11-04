"use client";

import { useState, useEffect } from "react";
import {
  importFromExcel,
  importMultipleRecords,
  getAllProfiles,
  createProfile,
  normalizeTime,
  formatDate,
} from "../lib/data";

export default function ImportExcel({ isOpen, onClose, onImportComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");

  useEffect(() => {
    if (isOpen) {
      const allProfiles = getAllProfiles();
      setProfiles(allProfiles);
      if (allProfiles.length > 0 && !selectedProfileId) {
        setSelectedProfileId(allProfiles[0].id);
      }
    }
  }, [isOpen, selectedProfileId]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileName = file.name.toLowerCase();
    const isValidFile =
      validExtensions.some((ext) => fileName.endsWith(ext)) ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel" ||
      file.type === "text/csv";

    if (!isValidFile) {
      setError("กรุณาเลือกไฟล์ Excel (.xlsx, .xls) หรือ CSV เท่านั้น");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPreview(null);

    try {
      const records = await importFromExcel(file);
      if (records.length === 0) {
        setError("ไม่พบข้อมูลในไฟล์ กรุณาตรวจสอบไฟล์ของคุณ");
        setIsProcessing(false);
        return;
      }
      setPreview(records);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการอ่านไฟล์: " + err.message);
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateProfileAndImport = () => {
    if (!newProfileName.trim()) {
      setError("กรุณากรอกชื่อโปรไฟล์");
      return;
    }

    const profile = createProfile(newProfileName);
    if (profile) {
      setSelectedProfileId(profile.id);
      setShowCreateProfile(false);
      setNewProfileName("");
      // Continue with import
      handleConfirmImport(profile.id);
    } else {
      setError("เกิดข้อผิดพลาดในการสร้างโปรไฟล์");
    }
  };

  const handleConfirmImport = (profileId = selectedProfileId) => {
    if (!preview || preview.length === 0) return;

    if (!profileId) {
      setError("กรุณาเลือกโปรไฟล์หรือสร้างโปรไฟล์ใหม่");
      return;
    }

    try {
      importMultipleRecords(preview, profileId);
      onImportComplete();
      handleCancel();
      alert(`นำเข้าข้อมูลสำเร็จ ${preview.length} รายการ`);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + err.message);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setError(null);
    setIsProcessing(false);
    setShowCreateProfile(false);
    setNewProfileName("");
    // Reset file input
    const fileInput = document.getElementById("excel-file-input");
    if (fileInput) fileInput.value = "";
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="sticky top-0 border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Import ข้อมูลจาก Excel
            </h2>
            <button
              onClick={handleCancel}
              className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Profile Selection */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              เลือกโปรไฟล์ <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">-- เลือกโปรไฟล์ --</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} ({profile.recordCount || 0} รายการ)
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCreateProfile(!showCreateProfile)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {showCreateProfile ? "ยกเลิก" : "+ สร้างใหม่"}
              </button>
            </div>
            {showCreateProfile && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="ชื่อโปรไฟล์ เช่น มกราคม 2025"
                  className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateProfileAndImport();
                    }
                  }}
                />
                <button
                  onClick={handleCreateProfileAndImport}
                  className="rounded-lg bg-linear-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/50 transition-all hover:shadow-xl dark:shadow-blue-900/50"
                >
                  สร้างและ Import
                </button>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              เลือกไฟล์ Excel (.xlsx, .xls หรือ .csv)
            </label>
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              รองรับไฟล์ Excel (.xlsx, .xls) และ CSV
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {isProcessing && !preview && (
            <div className="mb-4 text-center text-zinc-600 dark:text-zinc-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600"></div>
              <p className="mt-2">กำลังประมวลผลไฟล์...</p>
            </div>
          )}

          {preview && (
            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                ตัวอย่างข้อมูลที่จะ Import ({preview.length} รายการ)
              </h3>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
                    <tr>
                      <th className="px-4 py-2 text-left">ชื่อผู้ไลฟ์</th>
                      <th className="px-4 py-2 text-left">Platform</th>
                      <th className="px-4 py-2 text-left">วันที่</th>
                      <th className="px-4 py-2 text-left">เวลาเริ่ม</th>
                      <th className="px-4 py-2 text-left">เวลาหยุด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {preview.slice(0, 10).map((record, index) => (
                      <tr
                        key={index}
                        className="bg-white dark:bg-zinc-900"
                      >
                        <td className="px-4 py-2">{record.streamerName || "-"}</td>
                        <td className="px-4 py-2">{record.platform || "-"}</td>
                        <td className="px-4 py-2">
                          {formatDate(record.date) || "-"}
                        </td>
                        <td className="px-4 py-2">
                          {normalizeTime(record.startTime) ?? "-"}
                        </td>
                        <td className="px-4 py-2">
                          {normalizeTime(record.endTime) ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
                    และอีก {preview.length - 10} รายการ...
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              onClick={handleCancel}
              className="rounded-lg border border-zinc-300 px-6 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              ยกเลิก
            </button>
            {preview && (
              <button
                onClick={() => handleConfirmImport()}
                disabled={isProcessing || !selectedProfileId}
                className="rounded-lg bg-linear-to-r from-blue-600 to-purple-600 px-6 py-2 font-medium text-white shadow-lg shadow-blue-500/50 transition-all hover:shadow-xl disabled:opacity-50 dark:shadow-blue-900/50"
              >
                Import ข้อมูล ({preview.length} รายการ)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

