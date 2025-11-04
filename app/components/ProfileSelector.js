"use client";

import { useState, useEffect } from "react";
import {
  getAllProfiles,
  getCurrentProfile,
  setCurrentProfile,
  createProfile,
  deleteProfile,
} from "../lib/data";

export default function ProfileSelector({ onProfileChange }) {
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfileState] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDesc, setNewProfileDesc] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    const allProfiles = getAllProfiles();
    const current = getCurrentProfile();
    setProfiles(allProfiles);
    setCurrentProfileState(current);
    if (current && onProfileChange) {
      onProfileChange(current.id);
    }
  };

  const handleProfileSelect = (profileId) => {
    setCurrentProfile(profileId);
    setCurrentProfileState(getCurrentProfile());
    if (onProfileChange) {
      onProfileChange(profileId);
    }
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) {
      alert("กรุณากรอกชื่อโปรไฟล์");
      return;
    }

    const profile = createProfile(newProfileName, newProfileDesc);
    if (profile) {
      setCurrentProfile(profile.id);
      loadProfiles();
      setIsCreateModalOpen(false);
      setNewProfileName("");
      setNewProfileDesc("");
      if (onProfileChange) {
        onProfileChange(profile.id);
      }
      alert("สร้างโปรไฟล์สำเร็จ");
    } else {
      alert("เกิดข้อผิดพลาดในการสร้างโปรไฟล์");
    }
  };

  const handleDeleteProfile = (profileId, e) => {
    e.stopPropagation();
    
    if (
      !confirm(
        "คุณแน่ใจหรือไม่ที่จะลบโปรไฟล์นี้? ข้อมูลทั้งหมดในโปรไฟล์จะถูกลบและไม่สามารถกู้คืนได้!"
      )
    ) {
      return;
    }

    const success = deleteProfile(profileId);
    if (success) {
      loadProfiles();
      if (currentProfile?.id === profileId) {
        // ถ้าลบโปรไฟล์ปัจจุบัน ให้เปลี่ยนเป็นโปรไฟล์แรกหรือ null
        const remainingProfiles = getAllProfiles();
        if (remainingProfiles.length > 0) {
          handleProfileSelect(remainingProfiles[0].id);
        } else {
          if (onProfileChange) {
            onProfileChange(null);
          }
        }
      }
      alert("ลบโปรไฟล์สำเร็จ");
    } else {
      alert("เกิดข้อผิดพลาดในการลบโปรไฟล์");
    }
  };

  return (
    <>
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            เลือกโปรไฟล์
          </h3>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/50 transition-all hover:scale-105 hover:shadow-xl dark:shadow-blue-900/50"
          >
            <svg
              className="h-4 w-4"
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
            สร้างโปรไฟล์ใหม่
          </button>
        </div>

        {profiles.length === 0 ? (
          <p className="py-4 text-center text-zinc-600 dark:text-zinc-400">
            ยังไม่มีโปรไฟล์ กรุณาสร้างโปรไฟล์ใหม่
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => handleProfileSelect(profile.id)}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  currentProfile?.id === profile.id
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {profile.name}
                    </h4>
                    {profile.description && (
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {profile.description}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      {profile.recordCount || 0} รายการ
                    </div>
                    <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
                      {new Date(profile.createdAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                      })}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteProfile(profile.id, e)}
                    className="ml-2 rounded p-1 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <svg
                      className="h-4 w-4"
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
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Profile Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                สร้างโปรไฟล์ใหม่
              </h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  ชื่อโปรไฟล์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="เช่น มกราคม 2025"
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  คำอธิบาย (ไม่บังคับ)
                </label>
                <textarea
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  placeholder="เช่น ข้อมูลการไลฟ์เดือนมกราคม"
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewProfileName("");
                    setNewProfileDesc("");
                  }}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleCreateProfile}
                  className="rounded-lg bg-linear-to-r from-blue-600 to-purple-600 px-4 py-2 font-medium text-white shadow-lg shadow-blue-500/50 transition-all hover:shadow-xl dark:shadow-blue-900/50"
                >
                  สร้าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

