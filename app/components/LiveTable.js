"use client";

import {
  formatNumber,
  formatTimeForDisplay,
  normalizeTime,
  formatDate,
  formatDurationWithRounding,
} from "../lib/data";

export default function LiveTable({ records, onEdit, onDelete, profileId }) {
  if (records.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">
          ยังไม่มีข้อมูลการไลฟ์ กรุณาเพิ่มข้อมูลใหม่
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full table-auto">
        <thead>
          <tr className="border-b border-zinc-200 bg-purple-50 dark:border-zinc-800 dark:bg-purple-900/20">
            <th className="hidden px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 lg:table-cell lg:px-3 lg:text-xs">
              ประทับเวลา
            </th>
            <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 sm:px-3 sm:text-xs">
              ชื่อผู้ไลฟ์
            </th>
            <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 sm:px-3 sm:text-xs">
              Platform
            </th>
            <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 sm:px-3 sm:text-xs">
              วันที่
            </th>
            <th className="hidden px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 md:table-cell md:px-3 md:text-xs">
              เวลาเริ่ม
            </th>
            <th className="hidden px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 md:table-cell md:px-3 md:text-xs">
              เวลาหยุด
            </th>
            <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 sm:px-3 sm:text-xs">
              ระยะเวลา
            </th>
            <th className="hidden px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 lg:table-cell lg:px-3 lg:text-xs">
              การเข้าถึง
            </th>
            <th className="hidden px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 xl:table-cell xl:px-3 xl:text-xs">
              ถูกใจ
            </th>
            <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 sm:px-3 sm:text-xs">
              สั่งซื้อ
            </th>
            <th className="hidden px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 lg:table-cell lg:px-3 lg:text-xs">
              ยอดรวม
            </th>
            <th className="hidden px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 xl:table-cell xl:px-3 xl:text-xs">
              ตะกร้า
            </th>
            <th className="hidden px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 xl:table-cell xl:px-3 xl:text-xs">
              แชร์
            </th>
            <th className="hidden px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 lg:table-cell lg:px-3 lg:text-xs">
              ลิงก์รูป
            </th>
            <th className="hidden px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 xl:table-cell xl:px-3 xl:text-xs">
              หมายเหตุ
            </th>
            <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 sm:px-3 sm:text-xs">
              จัดการ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {records.map((record, index) => (
            <tr
              key={`${profileId || 'no-profile'}-${record.id}-${index}`}
              className={`transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                index % 2 === 0
                  ? "bg-white dark:bg-zinc-900"
                  : "bg-zinc-50/50 dark:bg-zinc-900/50"
              }`}
            >
              <td className="hidden whitespace-nowrap px-2 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 lg:table-cell lg:px-3 lg:text-sm">
                {new Date(record.timestamp).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </td>
              <td className="max-w-[80px] px-2 py-2 text-[11px] font-medium text-zinc-900 dark:text-zinc-100 sm:max-w-none sm:px-3 sm:text-sm">
                <span className="truncate block">
                  {record.streamerName || "-"}
                </span>
              </td>
              <td className="max-w-[100px] px-2 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 sm:max-w-none sm:px-3 sm:text-sm">
                <span className="truncate block" title={record.platform || "-"}>
                  {record.platform || "-"}
                </span>
              </td>
              <td className="whitespace-nowrap px-2 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 sm:px-3 sm:text-sm">
                {formatDate(record.date) || "-"}
              </td>
              <td className="hidden whitespace-nowrap px-2 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 md:table-cell md:px-3 md:text-sm">
                {formatTimeForDisplay(record.startTime)}
              </td>
              <td className="hidden whitespace-nowrap px-2 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 md:table-cell md:px-3 md:text-sm">
                {normalizeTime(record.endTime) ?? "-"}
              </td>
              <td className="whitespace-nowrap px-2 py-2 text-[11px] font-medium sm:px-3 sm:text-sm">
                {(() => {
                  const durationInfo = formatDurationWithRounding(
                    record.duration
                  );
                  return (
                    <span
                      className={
                        durationInfo.isRounded
                          ? "text-yellow-600 dark:text-yellow-400 font-semibold"
                          : "text-zinc-900 dark:text-zinc-100"
                      }
                    >
                      {durationInfo.display}
                    </span>
                  );
                })()}
              </td>
              <td className="hidden whitespace-nowrap px-2 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 lg:table-cell lg:px-3 lg:text-sm">
                {formatNumber(record.customerReach) || "-"}
              </td>
              <td className="hidden whitespace-nowrap px-2 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 xl:table-cell xl:px-3 xl:text-sm">
                {formatNumber(record.likes) || "-"}
              </td>
              <td className="whitespace-nowrap px-2 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 sm:px-3 sm:text-sm">
                {record.orders || "-"}
              </td>
              <td className="hidden whitespace-nowrap px-2 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 lg:table-cell lg:px-3 lg:text-sm">
                {formatNumber(record.totalAmount) || "-"}
              </td>
              <td className="hidden whitespace-nowrap px-2 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 xl:table-cell xl:px-3 xl:text-sm">
                {formatNumber(record.addToCart) || "-"}
              </td>
              <td className="hidden whitespace-nowrap px-2 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 xl:table-cell xl:px-3 xl:text-sm">
                {record.shares || "-"}
              </td>
              <td className="hidden px-2 py-2 text-[11px] lg:table-cell lg:px-3 lg:text-sm">
                {record.imageLink ? (
                  <a
                    href={record.imageLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 truncate block max-w-[80px]"
                    title={record.imageLink}
                  >
                    ดูลิงก์
                  </a>
                ) : (
                  <span className="text-zinc-400">-</span>
                )}
              </td>
              <td className="hidden px-2 py-2 text-[11px] text-zinc-600 dark:text-zinc-400 xl:table-cell xl:px-3 xl:text-sm">
                {record.notes ? (
                  <span
                    className="max-w-[120px] truncate block"
                    title={record.notes}
                  >
                    {record.notes}
                  </span>
                ) : (
                  <span className="text-zinc-400">-</span>
                )}
              </td>
              <td className="whitespace-nowrap px-2 py-2 text-[11px] sm:px-3 sm:text-sm">
                <div className="flex flex-col gap-1 sm:flex-row">
                  <button
                    onClick={() => onEdit(record)}
                    className="rounded px-2 py-1 text-[10px] text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 sm:px-3 sm:text-xs"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("คุณต้องการลบข้อมูลนี้หรือไม่?")) {
                        onDelete(record.id);
                      }
                    }}
                    className="rounded px-2 py-1 text-[10px] text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 sm:px-3 sm:text-xs"
                  >
                    ลบ
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
