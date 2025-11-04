"use client";

import { useState, useEffect } from "react";
import { getAllLiveRecords, formatNumber } from "../lib/data";
import Link from "next/link";

export default function SummaryPage() {
  const [records, setRecords] = useState([]);
  const [editableValues, setEditableValues] = useState({
    allTime: 0,
    allTimeLive: 0,
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // โหลดข้อมูลจาก localStorage
    const profileId = localStorage.getItem("live_stream_current_profile");
    const data = getAllLiveRecords(profileId);
    setRecords(data);

    // โหลดค่าที่บันทึกไว้ก่อน
    const summaryKey = "summary_values";
    const saved = localStorage.getItem(summaryKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEditableValues(parsed);
      } catch (e) {
        console.error("Error loading saved summary values:", e);
        // ถ้าโหลดไม่ได้ ให้ใช้ค่าจาก records
        const allTime = data.length;
        const allTimeLive = data.filter((r) => r.streamerName && r.platform).length;
        setEditableValues({ allTime, allTimeLive });
      }
    } else {
      // ถ้ายังไม่มีค่าที่บันทึกไว้ ให้คำนวณจาก records
      const allTime = data.length;
      const allTimeLive = data.filter((r) => r.streamerName && r.platform).length;
      setEditableValues({ allTime, allTimeLive });
    }
  }, []);

  // คำนวณสรุปยอดแยกตาม streamer และรวมทั้งหมด
  const calculateSummary = () => {
    const streamers = {};
    const total = {
      allTime: editableValues.allTime,
      allTimeLive: editableValues.allTimeLive,
      platforms: {
        "Tiktok Official": { time: 0, total: 0 },
        "Tiktok Mall": { time: 0, total: 0 },
        "Tiktok Thailand": { time: 0, total: 0 },
        Shopee: { time: 0, total: 0 },
      },
      totalSum: 0,
      totalTime: 0,
    };

    records.forEach((record) => {
      const streamerName = String(record.streamerName || "").trim();
      if (!streamerName) return;

      // คำนวณเวลาเป็นนาที
      const durationMinutes = (() => {
        if (!record.duration) return 0;
        const durationStr = String(record.duration);
        const timePart = durationStr.split("→")[0].trim();
        const match = timePart.match(/^(\d+):(\d+)$/);
        if (match) {
          const hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          return hours * 60 + minutes;
        }
        return 0;
      })();

      const totalAmount = parseFloat(
        String(record.totalAmount || 0).replace(/,/g, "")
      ) || 0;

      const platform = String(record.platform || "").trim();

      // สร้าง streamer entry ถ้ายังไม่มี
      if (!streamers[streamerName]) {
        streamers[streamerName] = {
          allTime: 0,
          allTimeLive: 0,
          platforms: {
            "Tiktok Official": { time: 0, total: 0 },
            "Tiktok Mall": { time: 0, total: 0 },
            "Tiktok Thailand": { time: 0, total: 0 },
            Shopee: { time: 0, total: 0 },
          },
          totalSum: 0,
          totalTime: 0,
        };
      }

      streamers[streamerName].allTime++;
      if (platform) {
        streamers[streamerName].allTimeLive++;
      }
      streamers[streamerName].totalTime += durationMinutes;
      streamers[streamerName].totalSum += totalAmount;

      // จัดกลุ่มตาม platform (ตรวจสอบหลายรูปแบบ - ต้องตรวจสอบ Official และ Mall ก่อน Thailand)
      let platformKey = null;
      // Normalize platform name: ลบ whitespace หลายตัว, แปลงเป็น lowercase, trim
      const platformLower = platform.toLowerCase().replace(/\s+/g, " ").trim();
      
      // Debug: เก็บ platform names ทั้งหมดเพื่อตรวจสอบ
      if (typeof window !== "undefined" && !window.platformDebug) {
        window.platformDebug = new Set();
      }
      if (typeof window !== "undefined" && window.platformDebug) {
        window.platformDebug.add(platform);
      }
      
      // ตรวจสอบ Tiktok Official ก่อน (ต้องตรวจสอบก่อน Thailand)
      // ตรวจสอบหลายรูปแบบ: "tiktok official", "tiktokofficial", "official tiktok", etc.
      if (
        platformLower.includes("official") && platformLower.includes("tiktok")
      ) {
        platformKey = "Tiktok Official";
      }
      // ตรวจสอบ Tiktok Mall (ต้องตรวจสอบก่อน Thailand)
      else if (
        platformLower.includes("mall") && platformLower.includes("tiktok")
      ) {
        platformKey = "Tiktok Mall";
      }
      // ตรวจสอบ Tiktok Thailand (ตรวจสอบหลังจาก Official และ Mall)
      else if (
        (platformLower.includes("tiktok") && platformLower.includes("thailand")) ||
        (platformLower.includes("tiktok") && platformLower.includes("thai")) ||
        (platformLower.includes("tiktok") && !platformLower.includes("official") && !platformLower.includes("mall"))
      ) {
        platformKey = "Tiktok Thailand";
      }
      // ตรวจสอบ Shopee
      else if (platformLower.includes("shopee")) {
        platformKey = "Shopee";
      }

      if (platformKey) {
        streamers[streamerName].platforms[platformKey].time += durationMinutes;
        streamers[streamerName].platforms[platformKey].total += totalAmount;
        total.platforms[platformKey].time += durationMinutes;
        total.platforms[platformKey].total += totalAmount;
      } else {
        // Debug: แสดง platform ที่ไม่ match
        console.log("Platform not matched:", platform, "for streamer:", streamerName);
      }

      total.totalSum += totalAmount;
      total.totalTime += durationMinutes;
    });

    return { streamers, total };
  };

  const { streamers, total } = calculateSummary();

  // แปลงนาทีเป็น HH:MM:SS
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:00`;
  };

  // คำนวณเฉลี่ยรายได้ต่อชั่วโมง
  const calculateAverageHourly = (totalSum, totalTime) => {
    if (totalTime === 0) return 0;
    return (totalSum / (totalTime / 60)).toFixed(2);
  };

  const sortedStreamers = Object.keys(streamers).sort();

  // Debug: แสดง platform names ทั้งหมดเมื่อ component mount
  useEffect(() => {
    if (records.length > 0 && typeof window !== "undefined") {
      const uniquePlatforms = [...new Set(records.map(r => r.platform).filter(Boolean))];
      console.log("All unique platforms found:", uniquePlatforms);
    }
  }, [records]);

  const handleSave = () => {
    setIsEditing(false);
    // บันทึกลง localStorage
    const summaryKey = "summary_values";
    localStorage.setItem(summaryKey, JSON.stringify(editableValues));
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              สรุปยอดรวม
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              อัพเดท: {new Date().toLocaleString("th-TH")}
            </p>
          </div>
          <div className="flex gap-4">
            {isEditing && (
              <button
                onClick={handleSave}
                className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                บันทึก
              </button>
            )}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              >
                แก้ไข
              </button>
            )}
            <Link
              href="/"
              className="rounded-lg border-2 border-zinc-300 bg-white px-6 py-2 font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              All time
            </div>
            {isEditing ? (
              <input
                type="number"
                value={editableValues.allTime}
                onChange={(e) =>
                  setEditableValues({
                    ...editableValues,
                    allTime: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-2xl font-bold text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            ) : (
              <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                {editableValues.allTime.toLocaleString()}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              All time Live
            </div>
            {isEditing ? (
              <input
                type="number"
                value={editableValues.allTimeLive}
                onChange={(e) =>
                  setEditableValues({
                    ...editableValues,
                    allTimeLive: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-2xl font-bold text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            ) : (
              <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
                {editableValues.allTimeLive.toLocaleString()}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              ยอดรวมทั้งหมด
            </div>
            <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
              {formatNumber(total.totalSum)}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              เฉลี่ยรายได้ต่อชั่วโมง
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(
                calculateAverageHourly(total.totalSum, total.totalTime)
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className="sticky left-0 z-10 border border-zinc-300 bg-zinc-100 px-2 py-2 text-left text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    รายการ
                  </th>
                  <th className="border border-zinc-300 px-2 py-2 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    All time
                  </th>
                  <th className="border border-zinc-300 px-2 py-2 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    All time Live
                  </th>
                  <th className="border border-zinc-300 px-2 py-2 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    TT Official
                  </th>
                  <th className="border border-zinc-300 px-2 py-2 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    TT Mall
                  </th>
                  <th className="border border-zinc-300 px-2 py-2 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    TT Thailand
                  </th>
                  <th className="border border-zinc-300 px-2 py-2 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    Shopee
                  </th>
                  <th className="border border-zinc-300 px-2 py-2 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    Real Live
                  </th>
                  <th className="border border-zinc-300 px-2 py-2 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    ยอด TT Official
                  </th>
                  <th className="border border-zinc-300 px-2 py-2 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    ยอด TT Mall
                  </th>
                  <th className="border border-zinc-300 px-2 py-2 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    ยอด TT Thai
                  </th>
                  <th className="border border-zinc-300 px-2 py-2 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    ยอด Shopee
                  </th>
                  <th className="border border-zinc-300 px-2 py-2 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    ยอดรวม
                  </th>
                  <th className="border border-zinc-300 px-2 py-2 text-center text-xs font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3 sm:text-sm">
                    เฉลี่ย/ชม.
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* แสดงข้อมูลแต่ละ streamer */}
                {sortedStreamers.map((streamerName) => {
                  const streamer = streamers[streamerName];
                  const avgHourly = calculateAverageHourly(
                    streamer.totalSum,
                    streamer.totalTime
                  );
                  return (
                    <tr
                      key={streamerName}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <td className="sticky left-0 z-10 border border-zinc-300 bg-white px-2 py-2 font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {streamerName}
                      </td>
                      <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {streamer.allTime}
                      </td>
                      <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {streamer.allTimeLive}
                      </td>
                      <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {formatTime(streamer.platforms["Tiktok Official"].time)}
                      </td>
                      <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {formatTime(streamer.platforms["Tiktok Mall"].time)}
                      </td>
                      <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {formatTime(
                          streamer.platforms["Tiktok Thailand"].time
                        )}
                      </td>
                      <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {formatTime(streamer.platforms.Shopee.time)}
                      </td>
                      <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {formatTime(streamer.totalTime)}
                      </td>
                      <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {formatNumber(
                          streamer.platforms["Tiktok Official"].total
                        )}
                      </td>
                      <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {formatNumber(streamer.platforms["Tiktok Mall"].total)}
                      </td>
                      <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {formatNumber(
                          streamer.platforms["Tiktok Thailand"].total
                        )}
                      </td>
                      <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {formatNumber(streamer.platforms.Shopee.total)}
                      </td>
                      <td className="border border-zinc-300 px-2 py-2 text-center font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {formatNumber(streamer.totalSum)}
                      </td>
                      <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                        {formatNumber(avgHourly)}
                      </td>
                    </tr>
                  );
                })}
                {/* แถวสรุปรวม */}
                <tr className="bg-orange-100 font-semibold dark:bg-orange-900/20">
                  <td className="sticky left-0 z-10 border border-zinc-300 bg-orange-100 px-2 py-2 font-bold text-zinc-900 dark:border-zinc-700 dark:bg-orange-900/20 dark:text-zinc-100 sm:px-3 sm:py-3">
                    รวม
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                    {total.allTime}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                    {total.allTimeLive}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                    {formatTime(total.platforms["Tiktok Official"].time)}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                    {formatTime(total.platforms["Tiktok Mall"].time)}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                    {formatTime(total.platforms["Tiktok Thailand"].time)}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                    {formatTime(total.platforms.Shopee.time)}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                    {formatTime(total.totalTime)}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                    {formatNumber(total.platforms["Tiktok Official"].total)}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                    {formatNumber(total.platforms["Tiktok Mall"].total)}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                    {formatNumber(total.platforms["Tiktok Thailand"].total)}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                    {formatNumber(total.platforms.Shopee.total)}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                    {formatNumber(total.totalSum)}
                  </td>
                  <td className="border border-zinc-300 px-2 py-2 text-center font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-3 sm:py-3">
                    {formatNumber(
                      calculateAverageHourly(total.totalSum, total.totalTime)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

