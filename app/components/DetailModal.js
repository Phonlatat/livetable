"use client";

import {
  formatNumber,
  formatTimeForDisplay,
  normalizeTime,
  formatDate,
  formatDurationWithRounding,
} from "../lib/data";

export default function DetailModal({ isOpen, onClose, record }) {
  if (!isOpen || !record) return null;

  const durationInfo = formatDurationWithRounding(record.duration);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            รายละเอียดการไลฟ์
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* ข้อมูลพื้นฐาน */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  ชื่อผู้ไลฟ์
                </label>
                <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                  {record.streamerName || "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Platform
                </label>
                <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                  {record.platform || "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  วันที่ไลฟ์
                </label>
                <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                  {formatDate(record.date) || "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  เวลาเริ่ม
                </label>
                <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                  {formatTimeForDisplay(record.startTime)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  เวลาสิ้นสุด
                </label>
                <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                  {normalizeTime(record.endTime) ?? "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  ระยะเวลา
                </label>
                <p
                  className={`mt-1 text-base font-medium ${
                    (() => {
                      // ตรวจสอบว่าการเวลาเกิน 10 ชั่วโมงหรือไม่
                      const durationStr = durationInfo.display;
                      const timePart = durationStr.split("→")[0].trim();
                      const match = timePart.match(/^(\d+):(\d+)$/);
                      if (match) {
                        const hours = parseInt(match[1], 10);
                        if (hours >= 10) {
                          return "text-red-600 dark:text-red-400";
                        }
                      }
                      return durationInfo.isRounded
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-zinc-900 dark:text-zinc-100";
                    })()
                  }`}
                >
                  {durationInfo.display}
                </p>
              </div>
            </div>

            {/* ข้อมูลสถิติ */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  จำนวนผู้เข้าถึง
                </label>
                <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                  {formatNumber(record.customerReach) || "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  จำนวนไลค์
                </label>
                <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                  {formatNumber(record.likes) || "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  จำนวนออเดอร์
                </label>
                <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                  {record.orders || "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  ยอดรวมทั้งหมด
                </label>
                <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                  {formatNumber(record.totalAmount) || "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  จำนวนตะกร้า
                </label>
                <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                  {formatNumber(record.addToCart) || "-"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  จำนวนแชร์
                </label>
                <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
                  {record.shares || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* ข้อมูลเพิ่มเติม */}
          <div className="mt-6 space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            {record.imageLink && (
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  ลิงก์รูปภาพ
                </label>
                <a
                  href={record.imageLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all text-base text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {record.imageLink}
                </a>
              </div>
            )}

            {record.notes && (
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  หมายเหตุ
                </label>
                <p className="mt-1 whitespace-pre-wrap text-base text-zinc-900 dark:text-zinc-100">
                  {record.notes}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                วันที่บันทึก
              </label>
              <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">
                {new Date(record.timestamp).toLocaleString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
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

