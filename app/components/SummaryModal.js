"use client";

import { formatNumber, normalizeTime, formatTimeForDisplay } from "../lib/data";

export default function SummaryModal({ isOpen, onClose, records }) {
  if (!isOpen) return null;

  // คำนวณสรุปยอดแยกตาม streamer และรวมทั้งหมด
  const calculateSummary = () => {
    const streamers = {};
    const total = {
      allTime: records.length,
      allTimeLive: records.filter((r) => r.streamerName && r.platform).length,
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
        // Parse "HH:MM" format หรือ "HH:MM → HH:MM" format
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

      // จัดกลุ่มตาม platform สำหรับ streamer
      let platformKey = null;
      if (platform.toLowerCase().includes("tiktok official")) {
        platformKey = "Tiktok Official";
      } else if (platform.toLowerCase().includes("tiktok mall")) {
        platformKey = "Tiktok Mall";
      } else if (
        platform.toLowerCase().includes("tiktok") ||
        platform.toLowerCase().includes("thailand")
      ) {
        platformKey = "Tiktok Thailand";
      } else if (platform.toLowerCase().includes("shopee")) {
        platformKey = "Shopee";
      }

      if (platformKey) {
        streamers[streamerName].platforms[platformKey].time += durationMinutes;
        streamers[streamerName].platforms[platformKey].total += totalAmount;
        total.platforms[platformKey].time += durationMinutes;
        total.platforms[platformKey].total += totalAmount;
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
    const secs = 0;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // คำนวณเฉลี่ยรายได้ต่อชั่วโมง
  const calculateAverageHourly = (totalSum, totalTime) => {
    if (totalTime === 0) return 0;
    return (totalSum / (totalTime / 60)).toFixed(2);
  };

  // เรียง streamers ตามชื่อ
  const sortedStreamers = Object.keys(streamers).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            สรุปยอดรวม
          </h2>
          <button
            onClick={onClose}
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

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            อัพเดท: {new Date().toLocaleString("th-TH")}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    รายการ
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    All time
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    All time Live
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    Tiktok Official Time
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    Tiktok Mall Time
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    Tiktok Thailand Time
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    Shopee Time
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    Real time Live
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    ยอดรวม Tiktok Official
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    ยอดรวม Tiktok Mall
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    ยอดรวม Tiktok Thailand
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    ยอดรวม Shopee
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    ยอดรวมทั้งหมด
                  </th>
                  <th className="border border-zinc-300 px-4 py-2 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    เฉลี่ยรายได้ต่อชั่วโมง
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
                      <td className="border border-zinc-300 px-4 py-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {streamerName}
                      </td>
                      <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {streamer.allTime}
                      </td>
                      <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {streamer.allTimeLive}
                      </td>
                      <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {formatTime(streamer.platforms["Tiktok Official"].time)}
                      </td>
                      <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {formatTime(streamer.platforms["Tiktok Mall"].time)}
                      </td>
                      <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {formatTime(
                          streamer.platforms["Tiktok Thailand"].time
                        )}
                      </td>
                      <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {formatTime(streamer.platforms.Shopee.time)}
                      </td>
                      <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {formatTime(streamer.totalTime)}
                      </td>
                      <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {formatNumber(
                          streamer.platforms["Tiktok Official"].total
                        )}
                      </td>
                      <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {formatNumber(streamer.platforms["Tiktok Mall"].total)}
                      </td>
                      <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {formatNumber(
                          streamer.platforms["Tiktok Thailand"].total
                        )}
                      </td>
                      <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {formatNumber(streamer.platforms.Shopee.total)}
                      </td>
                      <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {formatNumber(streamer.totalSum)}
                      </td>
                      <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                        {formatNumber(avgHourly)}
                      </td>
                    </tr>
                  );
                })}
                {/* แถวสรุปรวม */}
                <tr className="bg-orange-100 dark:bg-orange-900/20 font-semibold">
                  <td className="border border-zinc-300 px-4 py-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    รวม
                  </td>
                  <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {total.allTime}
                  </td>
                  <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {total.allTimeLive}
                  </td>
                  <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {formatTime(total.platforms["Tiktok Official"].time)}
                  </td>
                  <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {formatTime(total.platforms["Tiktok Mall"].time)}
                  </td>
                  <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {formatTime(total.platforms["Tiktok Thailand"].time)}
                  </td>
                  <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {formatTime(total.platforms.Shopee.time)}
                  </td>
                  <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {formatTime(total.totalTime)}
                  </td>
                  <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {formatNumber(total.platforms["Tiktok Official"].total)}
                  </td>
                  <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {formatNumber(total.platforms["Tiktok Mall"].total)}
                  </td>
                  <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {formatNumber(total.platforms["Tiktok Thailand"].total)}
                  </td>
                  <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {formatNumber(total.platforms.Shopee.total)}
                  </td>
                  <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {formatNumber(total.totalSum)}
                  </td>
                  <td className="border border-zinc-300 px-4 py-2 text-center text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                    {formatNumber(
                      calculateAverageHourly(total.totalSum, total.totalTime)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

