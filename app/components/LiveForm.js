'use client';

import { useState, useEffect } from 'react';
import { calculateDuration } from '../lib/data';

export default function LiveForm({ isOpen, onClose, onSave, initialData = null }) {
  const [formData, setFormData] = useState({
    streamerName: '',
    platform: '',
    date: '',
    startTime: '',
    endTime: '',
    customerReach: '',
    likes: '',
    orders: '',
    totalAmount: '',
    addToCart: '',
    shares: '',
    imageLink: '',
    notes: '',
  });

  const [calculatedDuration, setCalculatedDuration] = useState('');

  // เติมข้อมูลเมื่อเป็นโหมดแก้ไข
  useEffect(() => {
    if (initialData) {
      setFormData({
        streamerName: initialData.streamerName || '',
        platform: initialData.platform || '',
        date: initialData.date || '',
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        customerReach: initialData.customerReach || '',
        likes: initialData.likes || '',
        orders: initialData.orders || '',
        totalAmount: initialData.totalAmount || '',
        addToCart: initialData.addToCart || '',
        shares: initialData.shares || '',
        imageLink: initialData.imageLink || '',
        notes: initialData.notes || '',
      });
      setCalculatedDuration(initialData.duration || '');
    } else {
      // Reset form เมื่อเพิ่มข้อมูลใหม่
      setFormData({
        streamerName: '',
        platform: '',
        date: '',
        startTime: '',
        endTime: '',
        customerReach: '',
        likes: '',
        orders: '',
        totalAmount: '',
        addToCart: '',
        shares: '',
        imageLink: '',
        notes: '',
      });
      setCalculatedDuration('');
    }
  }, [initialData, isOpen]);

  // คำนวณ duration อัตโนมัติเมื่อเปลี่ยนเวลา
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const duration = calculateDuration(formData.startTime, formData.endTime);
      setCalculatedDuration(duration);
    } else {
      setCalculatedDuration('');
    }
  }, [formData.startTime, formData.endTime]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (initialData) {
      // แก้ไขข้อมูล
      onSave(initialData.id, formData);
    } else {
      // เพิ่มข้อมูลใหม่
      onSave(null, formData);
    }
    
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      streamerName: '',
      platform: '',
      date: '',
      startTime: '',
      endTime: '',
      customerReach: '',
      likes: '',
      orders: '',
      totalAmount: '',
      addToCart: '',
      shares: '',
      imageLink: '',
      notes: '',
    });
    setCalculatedDuration('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="sticky top-0 border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {initialData ? 'แก้ไขข้อมูลการไลฟ์' : 'เพิ่มข้อมูลการไลฟ์ใหม่'}
            </h2>
            <button
              onClick={handleClose}
              className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* ชื่อผู้ไลฟ์ */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ชื่อผู้ไลฟ์ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="streamerName"
                value={formData.streamerName}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Platform */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Platform <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                required
                placeholder="เช่น Shopee, TikTok"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* วันที่ */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                วันที่ไลฟ์ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* เวลาเริ่ม */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                เวลาเริ่มไลฟ์ <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* เวลาหยุด */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                เวลาหยุดไลฟ์ <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* ระยะเวลา (Auto-calculated) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ระยะเวลาไลฟ์ (คำนวณอัตโนมัติ)
              </label>
              <input
                type="text"
                value={calculatedDuration || '-'}
                disabled
                className="w-full rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-2 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
              />
            </div>

            {/* การเข้าถึงลูกค้า */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                การเข้าถึงลูกค้า
              </label>
              <input
                type="text"
                name="customerReach"
                value={formData.customerReach}
                onChange={handleChange}
                placeholder="เช่น 5243"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* ยอดกดถูกใจ */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ยอดกดถูกใจ
              </label>
              <input
                type="text"
                name="likes"
                value={formData.likes}
                onChange={handleChange}
                placeholder="เช่น 341 หรือ 1.62K"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* จำนวนการสั่งซื้อ */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                จำนวนการสั่งซื้อ
              </label>
              <input
                type="text"
                name="orders"
                value={formData.orders}
                onChange={handleChange}
                placeholder="เช่น 49"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* ยอดรวม */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ยอดรวม
              </label>
              <input
                type="text"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                placeholder="เช่น 6965.71"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* การกดลงตะกร้า */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                การกดลงตะกร้า
              </label>
              <input
                type="text"
                name="addToCart"
                value={formData.addToCart}
                onChange={handleChange}
                placeholder="เช่น 332 หรือ 59.00%"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* ยอดกดแชร์ */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ยอดกดแชร์
              </label>
              <input
                type="text"
                name="shares"
                value={formData.shares}
                onChange={handleChange}
                placeholder="เช่น 2"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* แนบรูป/ลิงก์ */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                แนบรูป/ลิงก์ (Google Drive หรือ URL อื่นๆ)
              </label>
              <input
                type="url"
                name="imageLink"
                value={formData.imageLink}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* หมายเหตุ */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* ปุ่ม */}
          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-zinc-300 px-6 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-lg bg-linear-to-r from-blue-600 to-purple-600 px-6 py-2 font-medium text-white shadow-lg shadow-blue-500/50 transition-all hover:shadow-xl dark:shadow-blue-900/50"
            >
              {initialData ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

