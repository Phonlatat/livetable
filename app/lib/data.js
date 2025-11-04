// Data model และ utility functions สำหรับจัดการข้อมูลการไลฟ์สตรีม

const STORAGE_KEY = "live_stream_data";
const PROFILES_KEY = "live_stream_profiles";
const CURRENT_PROFILE_KEY = "live_stream_current_profile";

// Data structure สำหรับการไลฟ์แต่ละครั้ง
export const createLiveRecord = (data) => {
  return {
    id: Date.now().toString(), // Unique ID
    timestamp: new Date().toISOString(),
    streamerName: data.streamerName || "",
    platform: data.platform || "",
    date: data.date || "",
    startTime: data.startTime || "",
    endTime: data.endTime || "",
    duration: calculateDuration(data.startTime, data.endTime),
    customerReach: data.customerReach || "",
    likes: data.likes || "",
    orders: data.orders || "",
    totalAmount: data.totalAmount || "",
    addToCart: data.addToCart || "",
    shares: data.shares || "",
    imageLink: data.imageLink || "",
    notes: data.notes || "",
  };
};

// แปลงค่าจาก Excel (หรือค่าใดๆ) เป็น "HH:MM" หรือ null ถ้าไม่ใช่เวลา
export const normalizeTime = (value) => {
  // helper: pad
  const pad = (n) => String(n).padStart(2, "0");

  // 1) null/undefined/empty
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // 2) Date object
  if (value instanceof Date && !isNaN(value)) {
    const h = value.getHours();
    const m = value.getMinutes();
    return `${pad(h)}:${pad(m)}`;
  }

  // 3) number: Excel time or serial
  if (typeof value === "number" && !isNaN(value)) {
    if (value >= 1) {
      // likely Excel serial (days since 1900/1899) -> convert to JS Date then extract time
      // Excel epoch = 1900-01-01, serial 1 = 1900-01-01
      // ใช้วิธีเดียวกับ formatExcelDate เพื่อความสอดคล้อง
      const excelEpoch = Date.UTC(1900, 0, 1); // 1900-01-01 00:00:00 UTC
      const d = new Date(excelEpoch + (value - 1) * 24 * 60 * 60 * 1000);
      // ใช้ local methods เพราะเวลาควรเป็น local time ที่ถูกต้อง
      const h = d.getHours();
      const m = d.getMinutes();
      return `${pad(h)}:${pad(m)}`;
    } else {
      // fraction of day (0..1) -> convert to minutes
      // Excel time: 0 = 00:00:00, 0.5 = 12:00:00, 1 = 24:00:00
      const totalMinutes = Math.round(value * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${pad(hours)}:${pad(minutes)}`;
    }
  }

  // 4) string: common time formats
  if (typeof value === "string") {
    const s = value.trim();

    // ถ้าเป็น "00:00:01" ให้แปลงเป็น "00:00" (backward compatibility)
    if (s === "00:00:01") {
      return "00:00";
    }

    // Allow "HH:MM" or "H:MM"
    const hhmm = s.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (hhmm) {
      const hh = hhmm[1].padStart(2, "0");
      const mm = hhmm[2].padStart(2, "0");
      return `${hh}:${mm}`;
    }

    // Accept 12-hour like "12:00 AM" or "1:05 PM"
    const ampm = s.match(/^([0-1]?\d|2[0-3]):([0-5]\d)\s*(AM|PM)$/i);
    if (ampm) {
      let hh = parseInt(ampm[1], 10);
      const mm = ampm[2].padStart(2, "0");
      const upper = ampm[3].toUpperCase();

      if (upper === "AM") {
        if (hh === 12) hh = 0;
      } else {
        if (hh !== 12) hh += 12;
      }

      return `${pad(hh)}:${mm}`;
    }

    // Optionally accept "midnight" or "noon"
    if (/^midnight$/i.test(s)) return "00:00";
    if (/^noon$/i.test(s)) return "12:00";

    // Try Date.parse fallback (last resort)
    const parsed = Date.parse(s);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    // if nothing matches, return null
    return null;
  }

  // default: not a time
  return null;
};

// แปลงเวลา "00:00:01" เป็น "00:00" สำหรับการแสดงผลและคำนวณ (backward compatibility)
const normalizeTimeForDisplay = (time) => {
  const normalized = normalizeTime(time);
  return normalized || "";
};

// คำนวณระยะเวลาไลฟ์อัตโนมัติ
export const calculateDuration = (startTime, endTime) => {
  const normalizedStart = normalizeTime(startTime);
  const normalizedEnd = normalizeTime(endTime);

  if (normalizedStart === null || normalizedEnd === null) return "";

  try {
    const [startHours, startMinutes] = normalizedStart.split(":").map(Number);
    const [endHours, endMinutes] = normalizedEnd.split(":").map(Number);

    let startTotal = startHours * 60 + startMinutes;
    let endTotal = endHours * 60 + endMinutes;

    // ถ้าเวลา end น้อยกว่า start แสดงว่าไลฟ์ข้ามวัน
    if (endTotal < startTotal) {
      endTotal += 24 * 60; // เพิ่ม 24 ชั่วโมง
    }

    const diffMinutes = endTotal - startTotal;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  } catch (error) {
    return "";
  }
};

// Format duration พร้อมปัดขึ้นเมื่อนาที >= 55 และคืนค่า flag ว่าเป็น rounded หรือไม่
export const formatDurationWithRounding = (duration) => {
  if (!duration || duration === "-" || duration === "") {
    return { display: "-", isRounded: false };
  }

  try {
    // Parse duration format "H:MM" หรือ "HH:MM"
    const parts = duration.split(":");
    if (parts.length !== 2) {
      return { display: duration, isRounded: false };
    }

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) {
      return { display: duration, isRounded: false };
    }

    // ถ้านาที >= 55 ให้ปัดขึ้น
    if (minutes >= 55) {
      const roundedHours = hours + 1;
      return {
        display: `${duration} → ${roundedHours}:00`,
        isRounded: true,
      };
    }

    // ถ้าไม่ต้องปัดขึ้น ให้แสดงตามเดิม
    return {
      display: duration,
      isRounded: false,
    };
  } catch (error) {
    return { display: duration, isRounded: false };
  }
};

// Export function สำหรับแสดงผลเวลา (แปลง "00:00:01" เป็น "00:00")
export const formatTimeForDisplay = (time) => {
  const normalized = normalizeTime(time);
  return normalized ?? "-";
};

// ==================== Profile Management ====================

// สร้างโปรไฟล์ใหม่
export const createProfile = (name, description = "") => {
  if (typeof window === "undefined") return null;

  try {
    const profiles = getAllProfiles();
    const newProfile = {
      id: `profile_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recordCount: 0,
    };
    profiles.push(newProfile);
    saveProfiles(profiles);
    return newProfile;
  } catch (error) {
    console.error("Error creating profile:", error);
    return null;
  }
};

// อ่านโปรไฟล์ทั้งหมด
export const getAllProfiles = () => {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(PROFILES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading profiles:", error);
    return [];
  }
};

// บันทึกโปรไฟล์ทั้งหมด
const saveProfiles = (profiles) => {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    return true;
  } catch (error) {
    console.error("Error saving profiles:", error);
    return false;
  }
};

// ตั้งค่าโปรไฟล์ปัจจุบัน
export const setCurrentProfile = (profileId) => {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem(CURRENT_PROFILE_KEY, profileId);
    return true;
  } catch (error) {
    console.error("Error setting current profile:", error);
    return false;
  }
};

// อ่านโปรไฟล์ปัจจุบัน
export const getCurrentProfile = () => {
  if (typeof window === "undefined") return null;

  try {
    const profileId = localStorage.getItem(CURRENT_PROFILE_KEY);
    if (!profileId) return null;

    const profiles = getAllProfiles();
    return profiles.find((p) => p.id === profileId) || null;
  } catch (error) {
    console.error("Error getting current profile:", error);
    return null;
  }
};

// อัปเดตโปรไฟล์
export const updateProfile = (profileId, updates) => {
  if (typeof window === "undefined") return null;

  try {
    const profiles = getAllProfiles();
    const index = profiles.findIndex((p) => p.id === profileId);
    if (index === -1) return null;

    profiles[index] = {
      ...profiles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveProfiles(profiles);
    return profiles[index];
  } catch (error) {
    console.error("Error updating profile:", error);
    return null;
  }
};

// ลบโปรไฟล์
export const deleteProfile = (profileId) => {
  if (typeof window === "undefined") return false;

  try {
    // ลบข้อมูลของโปรไฟล์
    const storageKey = `${STORAGE_KEY}_${profileId}`;
    localStorage.removeItem(storageKey);

    // ลบโปรไฟล์จากรายการ
    const profiles = getAllProfiles();
    const filtered = profiles.filter((p) => p.id !== profileId);
    saveProfiles(filtered);

    // ถ้าเป็นโปรไฟล์ปัจจุบัน ให้เปลี่ยนเป็น null
    const currentProfileId = localStorage.getItem(CURRENT_PROFILE_KEY);
    if (currentProfileId === profileId) {
      localStorage.removeItem(CURRENT_PROFILE_KEY);
    }

    return true;
  } catch (error) {
    console.error("Error deleting profile:", error);
    return false;
  }
};

// ==================== Data Management (with Profile Support) ====================

// อ่านข้อมูลทั้งหมดจาก localStorage (รองรับโปรไฟล์)
export const getAllLiveRecords = (profileId = null) => {
  if (typeof window === "undefined") return [];

  try {
    // ถ้ามี profileId ใช้ key แยก
    if (profileId) {
      const storageKey = `${STORAGE_KEY}_${profileId}`;
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    }

    // สำหรับ backward compatibility
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading data:", error);
    return [];
  }
};

// บันทึกข้อมูลทั้งหมดลง localStorage (รองรับโปรไฟล์)
export const saveAllLiveRecords = (records, profileId = null) => {
  if (typeof window === "undefined") return false;

  try {
    // ถ้ามี profileId ใช้ key แยก
    if (profileId) {
      const storageKey = `${STORAGE_KEY}_${profileId}`;
      localStorage.setItem(storageKey, JSON.stringify(records));

      // อัปเดตจำนวน records ในโปรไฟล์
      const profile = getAllProfiles().find((p) => p.id === profileId);
      if (profile) {
        updateProfile(profileId, { recordCount: records.length });
      }
      return true;
    }

    // สำหรับ backward compatibility
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (error) {
    console.error("Error saving data:", error);
    return false;
  }
};

// เพิ่มข้อมูลใหม่ (รองรับโปรไฟล์)
export const addLiveRecord = (data, profileId = null) => {
  const records = getAllLiveRecords(profileId);
  const newRecord = createLiveRecord(data);
  records.push(newRecord);
  saveAllLiveRecords(records, profileId);
  return newRecord;
};

// อัปเดตข้อมูล (รองรับโปรไฟล์)
export const updateLiveRecord = (id, data, profileId = null) => {
  const records = getAllLiveRecords(profileId);
  const index = records.findIndex((record) => record.id === id);

  if (index === -1) return null;

  // คำนวณ duration ใหม่ถ้ามีการเปลี่ยนเวลา
  const duration = calculateDuration(data.startTime, data.endTime);

  records[index] = {
    ...records[index],
    ...data,
    duration,
  };

  saveAllLiveRecords(records, profileId);
  return records[index];
};

// ลบข้อมูล (รองรับโปรไฟล์)
export const deleteLiveRecord = (id, profileId = null) => {
  const records = getAllLiveRecords(profileId);
  const filtered = records.filter((record) => record.id !== id);
  saveAllLiveRecords(filtered, profileId);
  return filtered;
};

// Helper function สำหรับแปลงค่า K เป็นตัวเลข หรือแปลง string เป็นตัวเลข
const convertKToNumber = (value) => {
  if (!value || value === "-" || value === "") {
    // ถ้าเป็น empty string หรือ "-" ให้ return 0 แทน เพื่อหลีกเลี่ยง NaN
    return 0;
  }

  // ถ้าเป็นตัวเลขอยู่แล้ว ให้ return เลขนั้น
  if (typeof value === "number") {
    return isNaN(value) ? 0 : value;
  }

  const strValue = String(value).trim();

  // ตรวจสอบว่ามี K (case-insensitive)
  const kMatch = strValue.match(/^([\d,]+\.?\d*)\s*[Kk]$/);
  if (kMatch) {
    const numValue = parseFloat(kMatch[1].replace(/,/g, ""));
    if (!isNaN(numValue)) {
      // คูณด้วย 1000 เพื่อแปลง K เป็นตัวเลขจริง
      return numValue * 1000;
    }
  }

  // ลองแปลง string เป็นตัวเลข
  const numValue = parseFloat(strValue.replace(/,/g, ""));
  if (!isNaN(numValue)) {
    return numValue;
  }

  // ถ้าแปลงไม่ได้ ให้ return 0 แทนที่จะ return string เพื่อหลีกเลี่ยง NaN
  return 0;
};

// Format ตัวเลขให้มี comma separator
export const formatNumber = (value) => {
  if (!value || value === "-" || value === "") return value;

  // ถ้าเป็น string ที่มี K (เช่น "1.62K") ให้แปลงเป็นตัวเลขก่อน
  const convertedValue = convertKToNumber(value);

  // ถ้าแปลงได้แล้ว ให้ format เป็นตัวเลข
  if (typeof convertedValue === "number") {
    return convertedValue.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  // ถ้าเป็นเปอร์เซ็นต์ ให้ return ตามเดิม
  if (typeof value === "string" && value.includes("%")) {
    return value;
  }

  const num = parseFloat(convertedValue.toString().replace(/,/g, ""));
  if (isNaN(num)) return value;

  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

// Format วันที่ให้อ่านง่าย (DD-MM-YY)
export const formatDate = (dateString) => {
  if (!dateString) return "";

  try {
    // ถ้าเป็น format YYYY-MM-DD ให้ parse โดยตรงเพื่อหลีกเลี่ยงปัญหา timezone
    if (
      typeof dateString === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ) {
      const [year, month, day] = dateString.split("-");
      // เพิ่ม 1 วันเพื่อแก้ปัญหาวันที่ที่ลดลง 1 วัน
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      date.setDate(date.getDate() + 1); // เพิ่ม 1 วัน
      const newDay = String(date.getDate()).padStart(2, "0");
      const newMonth = String(date.getMonth() + 1).padStart(2, "0");
      const newYear = String(date.getFullYear()).slice(-2);
      return `${newDay}-${newMonth}-${newYear}`;
    }

    // ถ้าเป็น format อื่น ให้ parse เป็น Date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    // เพิ่ม 1 วันเพื่อแก้ปัญหาวันที่ที่ลดลง 1 วัน
    date.setDate(date.getDate() + 1);

    // ใช้ local methods
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2); // เอา 2 หลักสุดท้าย
    return `${day}-${month}-${year}`;
  } catch (error) {
    return dateString;
  }
};

// Helper function สำหรับ trim และ clean ข้อมูล
const trimValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") {
    // ถ้าเป็นตัวเลขหรือค่าอื่นๆ ให้แปลงเป็น string ก่อน
    value = String(value);
  }
  // Trim whitespace และตรวจสอบว่าไม่ใช่ empty string
  const trimmed = value.trim();
  return trimmed === "" ? "" : trimmed;
};

// Clean whitespace ที่ซ้ำๆ และ normalize
const cleanValue = (value) => {
  const trimmed = trimValue(value);
  if (!trimmed) return "";
  // ลบ whitespace ที่ซ้ำๆ (หลายช่องว่างติดกัน)
  return trimmed.replace(/\s+/g, " ");
};

// ตรวจสอบว่าค่าว่างหรือไม่
const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") {
    return value.trim() === "";
  }
  return false;
};

// Helper function สำหรับดึงค่าและ clean จากหลาย keys (ไม่ trim เพื่อเช็คข้อมูลดิบ)
// รองรับการค้นหาชื่อคอลัมน์ที่มี whitespace แตกต่างกัน
const getValue = (row, ...keys) => {
  for (const key of keys) {
    // ลองอ่านตรงๆ ก่อน
    let value = row[key];

    // ถ้าไม่เจอ และชื่อ key มีช่องว่าง ให้ลอง normalize whitespace
    if (
      (value === null || value === undefined) &&
      typeof key === "string" &&
      key.includes(" ")
    ) {
      // ลองหาคอลัมน์ที่มี whitespace แตกต่างกัน
      const normalizedKey = key.replace(/\s+/g, " ");
      const allKeys = Object.keys(row);
      const matchedKey = allKeys.find(
        (k) => k.replace(/\s+/g, " ") === normalizedKey
      );
      if (matchedKey) {
        value = row[matchedKey];
      }
    }

    // ถ้าเป็น Date object ให้ return โดยตรง (จาก cellDates: true)
    if (value instanceof Date && !isNaN(value)) {
      return value;
    }
    // ถ้าเป็นตัวเลข (เช่น Excel serial number) ให้ return เลขโดยตรง
    if (typeof value === "number") {
      return value;
    }
    // ถ้าเป็น null หรือ undefined ให้ข้าม
    if (value === null || value === undefined) {
      continue;
    }
    // Return ค่าดิบโดยไม่ trim
    if (typeof value === "string" && value !== "") {
      return value;
    }
    // ถ้าเป็นค่าอื่นๆ (เช่น boolean) ให้แปลงเป็น string
    if (value !== "") {
      return String(value);
    }
  }
  return "";
};

// formatExcelDate (ไม่ trim เพื่อเช็คข้อมูลดิบ)
const formatExcelDate = (dateValue) => {
  if (dateValue === null || dateValue === undefined || dateValue === "") {
    return "";
  }

  // ถ้าเป็น Date object (จาก cellDates: true)
  if (dateValue instanceof Date && !isNaN(dateValue)) {
    // Date object จาก cellDates: true จะเป็น local date ที่ถูกต้องอยู่แล้ว
    // ไม่ต้องใช้ UTC methods เพราะจะทำให้วันที่คลาดเคลื่อน
    // ใช้ local methods เพื่อให้ได้วันที่ที่ถูกต้อง
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, "0");
    const day = String(dateValue.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // ถ้าเป็นตัวเลข (Excel date serial number) ให้แปลงก่อน
  if (typeof dateValue === "number") {
    // Excel date serial number: serial 1 = 1900-01-01
    // ใช้ epoch = 1900-01-01 และลบ 1 จาก serial number
    const excelEpoch = Date.UTC(1900, 0, 1); // 1900-01-01 00:00:00 UTC
    const date = new Date(excelEpoch + (dateValue - 1) * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      // ใช้ local methods เพราะวันที่จาก Excel serial เป็นวันที่ที่ถูกต้องแล้ว
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return "";
  }

  // ถ้าเป็น string
  if (typeof dateValue === "string") {
    // ถ้าเป็น format dd/mm/yyyy หรือ d/m/yyyy (เช่น 01/10/2025) ให้จัดการก่อน
    if (dateValue.includes("/")) {
      const parts = dateValue.split("/");
      if (parts.length === 3) {
        const day = parts[0].trim().padStart(2, "0");
        const month = parts[1].trim().padStart(2, "0");
        const year = parts[2].trim();
        // ตรวจสอบว่า year เป็น 4 หลักหรือไม่
        if (year.length === 4) {
          return `${year}-${month}-${day}`;
        } else if (year.length === 2) {
          // ถ้าเป็น 2 หลัก ให้แปลงเป็น 4 หลัก (เช่น 25 -> 2025)
          const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
          return `${fullYear}-${month}-${day}`;
        }
      }
    }

    // ลอง parse เป็น date (ถ้าไม่ได้ format dd/mm/yyyy)
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      // ใช้ local methods เพราะวันที่ควรเป็น local date ที่ถูกต้อง
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    // ถ้าเป็น string ที่เป็นตัวเลข (Excel serial number ที่เป็น string)
    const numValue = parseFloat(dateValue);
    if (!isNaN(numValue) && numValue > 0) {
      // Excel serial 1 = 1900-01-01
      const excelEpoch = Date.UTC(1900, 0, 1); // 1900-01-01 00:00:00 UTC
      const date = new Date(excelEpoch + (numValue - 1) * 24 * 60 * 60 * 1000);
      if (!isNaN(date.getTime())) {
        // ใช้ local methods เพราะวันที่จาก Excel serial เป็นวันที่ที่ถูกต้องแล้ว
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }

    // Return ค่าดิบโดยไม่ trim
    return dateValue;
  }

  return "";
};

// Helper function สำหรับ format เวลา
const formatTime = (timeValue) => {
  // Debug: แสดง input ทุกครั้ง (เฉพาะสำหรับค่าเวลาที่น่าสงสัย)
  const debugMode = false; // ตั้งเป็น true เพื่อเปิด debug mode

  // ตรวจสอบกรณี empty/null/undefined
  if (timeValue === null || timeValue === undefined || timeValue === "") {
    return "";
  }

  // ตรวจสอบกรณี 0 หรือ 0.0 โดยเฉพาะ (ต้อง return "00:00" ไม่ใช่ empty string)
  // แต่ต้องตรวจสอบก่อนว่าเป็น number type จริงๆ
  if (typeof timeValue === "number" && (timeValue === 0 || timeValue === 0.0)) {
    return "00:00";
  }

  // ถ้าเป็นตัวเลข (fraction of day ใน Excel) ให้แปลงก่อน
  if (typeof timeValue === "number") {
    // Excel time serial number: 0 = 00:00:00, 1 = 24:00:00
    // ใช้ Math.round() แทน Math.floor() เพื่อให้ปัดเศษเป็นเวลาที่ใกล้เคียงที่สุด
    // ตัวอย่าง: 0.414583333 (9:57) ไม่ควรปัดลงเป็น 9:56
    // หมายเหตุ: 0 หรือ 0.0 = 00:00:00 ต้องแสดงเป็น "00:00" ไม่ใช่ empty string
    const totalSeconds = Math.round(timeValue * 24 * 60 * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.round((totalSeconds % 3600) / 60); // ปัดเศษนาที

    // ตรวจสอบและแก้ไขค่าที่เกิน 23:59
    let validHours = hours >= 0 && hours <= 23 ? hours : hours % 24;
    let validMinutes = minutes >= 0 && minutes <= 59 ? minutes : minutes % 60;

    // ตรวจสอบว่า hours หรือ minutes เป็น NaN (ไม่ควรเกิด)
    if (isNaN(validHours)) validHours = 0;
    if (isNaN(validMinutes)) validMinutes = 0;

    const result = `${String(validHours).padStart(2, "0")}:${String(
      validMinutes
    ).padStart(2, "0")}`;

    // ตรวจสอบว่าถ้า result เป็น "00:00" ให้ return "00:00" โดยตรง (ไม่ใช่ empty string)
    if (result === "00:00") {
      return "00:00";
    }

    return result;
  }

  // ถ้าเป็น string
  if (typeof timeValue === "string") {
    // ลบ whitespace ที่ไม่จำเป็นออก
    const trimmed = timeValue.trim();
    if (trimmed === "") {
      return "";
    }

    // ตรวจสอบกรณี "0", "0:00", "00:00", "0:00:00", "00:00:00" โดยเฉพาะ
    if (
      trimmed === "0" ||
      trimmed === "0:00" ||
      trimmed === "00:00" ||
      trimmed === "0:00:00" ||
      trimmed === "00:00:00" ||
      trimmed.match(/^0+:0+:?0*$/)
    ) {
      return "00:00";
    }

    // ถ้าเป็น string ที่มี ":"
    if (trimmed.includes(":")) {
      // ใช้ regex เพื่อตรวจจับ AM/PM ที่ครอบคลุมมากกว่า
      // รองรับ: "12:00 PM", "12:00PM", "12:00 PM ", "12:00pm", "12:00 am", "12:00AM", "12:01 AM"
      // และ "1:54:00 AM", "9:57:00 AM" (ไม่มี 0 นำหน้าและมีวินาที)
      const amPmRegex = /(am|pm)/i;
      const amPmMatch = trimmed.match(amPmRegex);

      // แยกชั่วโมง นาที วินาที (ลบ AM/PM ออก)
      const timeOnly = trimmed.replace(/\s*(am|pm)\s*/gi, "").trim();
      const parts = timeOnly.split(":");

      // ตรวจสอบจำนวน parts (อาจมี 2 หรือ 3 parts: HH:MM หรือ HH:MM:SS)
      if (parts.length < 2) {
        return timeValue;
      }

      let hour = parseInt(parts[0]?.trim() || "0");
      let minute = parts[1] ? parseInt(parts[1].trim().split(" ")[0]) : 0; // เอาเฉพาะนาที (ตัดวินาทีถ้ามี)
      // ไม่ใช้ parts[2] (วินาที) เพราะไม่ต้องการ

      // ตรวจสอบว่า hour และ minute เป็นตัวเลขที่ถูกต้อง
      if (isNaN(hour)) {
        hour = 0;
      }
      if (isNaN(minute)) {
        minute = 0;
      }

      // จัดการ AM/PM ถ้ามี
      if (amPmMatch) {
        const isPM = amPmMatch[1].toLowerCase() === "pm";

        // กรณีพิเศษ: 12:00 AM = 00:00, 12:00 PM = 12:00
        // และ 12:01 AM = 00:01, 12:01 PM = 12:01
        // และ 12:00:00 AM = 00:00 (มีวินาที)
        // และ 1:54:00 AM = 01:54 (ไม่มี 0 นำหน้า)
        if (hour === 12) {
          hour = isPM ? 12 : 0;
        } else if (isPM) {
          // PM และไม่ใช่ 12:00 ให้บวก 12
          hour += 12;
        }
        // AM และไม่ใช่ 12:00 ไม่ต้องทำอะไร (เก็บค่าเดิม)
      } else {
        // ถ้าไม่มี AM/PM อาจเป็น 24-hour format อยู่แล้ว (เช่น "00:00:00", "23:59:00", "0:00:00")
        // ตรวจสอบว่า hour อยู่ในช่วงที่ถูกต้อง
        if (hour < 0 || hour > 23) {
          // ถ้า hour เกิน 23 ให้ wrap around
          hour = hour % 24;
          if (hour < 0) hour = 0;
        }
        // ถ้า hour อยู่ในช่วง 0-23 ให้ใช้ค่าตามเดิม (เป็น 24-hour format อยู่แล้ว)

        // ตรวจสอบกรณี "0:00:00" หรือ "00:00:00" (24-hour format) - ต้อง return "00:00"
        if (hour === 0 && minute === 0) {
          return "00:00";
        }
      }

      // Validate และแก้ไขค่าที่ไม่ถูกต้อง
      if (hour < 0 || hour > 23) {
        hour = hour % 24;
        if (hour < 0) hour = 0;
      }
      if (minute < 0 || minute > 59) {
        minute = minute % 60;
        if (minute < 0) minute = 0;
      }

      const result = `${String(hour).padStart(2, "0")}:${String(
        minute
      ).padStart(2, "0")}`;

      // ตรวจสอบว่าถ้า result เป็น "00:00" ให้ return "00:00" โดยตรง (ไม่ใช่ empty string)
      if (result === "00:00") {
        return "00:00";
      }

      return result;
    }

    // ถ้าเป็น string ที่เป็นตัวเลข (Excel serial number ที่เป็น string)
    const numValue = parseFloat(timeValue);
    if (!isNaN(numValue) && numValue >= 0 && numValue < 1) {
      // ใช้ Math.round() แทน Math.floor() เพื่อให้ปัดเศษเป็นเวลาที่ใกล้เคียงที่สุด
      const totalSeconds = Math.round(numValue * 24 * 60 * 60);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.round((totalSeconds % 3600) / 60); // ปัดเศษนาที

      // ตรวจสอบและแก้ไขค่าที่เกิน 23:59
      const validHours = hours >= 0 && hours <= 23 ? hours : hours % 24;
      const validMinutes =
        minutes >= 0 && minutes <= 59 ? minutes : minutes % 60;

      const result = `${String(validHours).padStart(2, "0")}:${String(
        validMinutes
      ).padStart(2, "0")}`;

      // ตรวจสอบว่าถ้า result เป็น "00:00" ให้ return "00:00" โดยตรง
      if (result === "00:00") {
        return "00:00";
      }

      return result;
    }

    // Return ค่าดิบถ้าไม่สามารถแปลงได้
    return timeValue;
  }

  // ถ้าเป็น type อื่น (เช่น boolean, object)
  return "";
};

// Import ข้อมูลจากไฟล์ Excel
export const importFromExcel = async (file) => {
  if (typeof window === "undefined") {
    throw new Error("Import function must be called on client side");
  }

  // Dynamic import เพื่อหลีกเลี่ยง SSR issues
  const XLSX = await import("xlsx");

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true, // ให้ cell ที่เป็นวัน/เวลา ถูกอ่านเป็น Date เมื่อเป็นไปได้
        });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        // ใช้ raw: true เพื่อเก็บค่าตัวเลขเวลา (Excel serial number) ไว้เป็นตัวเลข
        // เพื่อให้สามารถแปลงเป็นเวลาที่ถูกต้องได้
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          raw: true, // เก็บ raw values สำหรับตัวเลข (เวลา Excel serial number)
          defval: null, // ใช้ null สำหรับเซลล์ว่าง
        });

        // แปลงข้อมูลจาก Excel ให้ตรงกับ format ของเรา
        const convertedRecords = jsonData.map((row, index) => {
          // อ่านข้อมูลดิบจาก Excel
          const rawData = {
            streamerName: getValue(
              row,
              "ชื่อผู้ไลฟ์",
              "Streamer Name",
              "streamerName",
              "ชื่อ"
            ),
            platform: getValue(row, "Platform", "platform", "แพลตฟอร์ม"),
            date: (() => {
              // อ่านโดยตรงจาก "วันที่" ก่อน
              let rawValue = row["วันที่"];

              // ถ้าไม่เจอ ให้ลองหาจากชื่อคอลัมน์ที่มี "วันที่" แต่มี whitespace ต่างกัน
              if (
                !rawValue ||
                rawValue === null ||
                rawValue === undefined ||
                (typeof rawValue === "string" && rawValue.trim() === "")
              ) {
                // ลองหาคอลัมน์ที่มีชื่อใกล้เคียงกับ "วันที่"
                const allKeys = Object.keys(row);
                const dateKey = allKeys.find(
                  (k) =>
                    k.replace(/\s+/g, "") === "วันที่" ||
                    k.trim() === "วันที่" ||
                    k === "วันที"
                );
                if (dateKey) {
                  rawValue = row[dateKey];
                }

                // ถ้ายังไม่มี ให้ลองชื่ออื่นๆ
                if (
                  !rawValue ||
                  rawValue === null ||
                  rawValue === undefined ||
                  (typeof rawValue === "string" && rawValue.trim() === "")
                ) {
                  rawValue = getValue(
                    row,
                    "วันที",
                    "Date",
                    "date",
                    "วันที่ไลฟ์"
                  );
                }
              }

              return formatExcelDate(rawValue);
            })(),
            startTime: (() => {
              // อ่านโดยตรงจาก "เวลาเริ่ม  Live" (ช่องว่าง 2 ช่อง) ก่อน
              // และ "เวลาเริ่ม Live" (ช่องว่าง 1 ช่อง) เป็น fallback
              let rawValue = row["เวลาเริ่ม  Live"] || row["เวลาเริ่ม Live"];

              // ถ้าไม่มี ให้ลองหาจากชื่อคอลัมน์ที่คล้ายกัน
              if (
                !rawValue ||
                rawValue === null ||
                rawValue === undefined ||
                (typeof rawValue === "string" && rawValue.trim() === "")
              ) {
                // ลองหาคอลัมน์ที่มีคำว่า "เวลาเริ่ม" และ "Live" หรือ "live"
                const allKeys = Object.keys(row);
                const startTimeKey = allKeys.find(
                  (k) =>
                    k.includes("เวลาเริ่ม") &&
                    (k.toLowerCase().includes("live") || k.includes("Live"))
                );
                if (startTimeKey) {
                  rawValue = row[startTimeKey];
                }
              }

              // ถ้ายังไม่มี ให้ลองชื่ออื่นๆ
              if (
                !rawValue ||
                rawValue === null ||
                rawValue === undefined ||
                (typeof rawValue === "string" && rawValue.trim() === "")
              ) {
                rawValue = getValue(
                  row,
                  "Start Time Live",
                  "เวลาเริ่ม",
                  "Start Time",
                  "startTime",
                  "startTimeLive"
                );
              }

              // ใช้ normalizeTime เพื่อแปลงค่าเป็น "HH:MM" หรือ null
              const normalized = normalizeTime(rawValue);
              return normalized ?? "";
            })(),
            endTime: (() => {
              // อ่านโดยตรงจาก "เวลาจบ Live" ก่อน (ชื่อจริงใน Excel)
              // และ "เวลาหยุด Live" เป็น fallback
              let rawValue = row["เวลาจบ Live"] || row["เวลาหยุด Live"];

              // ถ้าไม่มี ให้ลองชื่ออื่นๆ
              if (
                !rawValue ||
                rawValue === null ||
                rawValue === undefined ||
                (typeof rawValue === "string" && rawValue.trim() === "")
              ) {
                rawValue = getValue(
                  row,
                  "เวลาหยุด Live",
                  "End Time Live",
                  "เวลาหยุด",
                  "End Time",
                  "endTime",
                  "endTimeLive"
                );
              }

              // ใช้ normalizeTime เพื่อแปลงค่าเป็น "HH:MM" หรือ null
              const normalized = normalizeTime(rawValue);
              return normalized ?? "";
            })(),
            duration: (() => {
              // อ่านโดยตรงจาก "ระยะเวลาในการ Live ทั้งหมดกี่ชั้วโมง (" ก่อน
              let rawValue = row["ระยะเวลาในการ Live ทั้งหมดกี่ชั้วโมง ("];

              // ถ้าไม่มี ให้ลองชื่ออื่นๆ
              if (!rawValue || rawValue === null || rawValue === undefined) {
                rawValue =
                  getValue(
                    row,
                    "ระยะเวลาในการ Live ทั้งหมดก็ชั่วโมง",
                    "ระยะเวลาในการ Live",
                    "ระยะเวลา",
                    "Duration",
                    "duration",
                    "ชั่วโมง"
                  ) || "";
              }

              return rawValue;
            })(),
            customerReach: getValue(
              row,
              "การเข้าถึงของลูกค้า",
              "Customer Reach",
              "การเข้าถึง",
              "customerReach",
              "การเข้าถึงลูกค้า"
            ),
            likes: (() => {
              // อ่านโดยตรงจาก "ยอดกดถูกใจ" ก่อน
              let rawValue = row["ยอดกดถูกใจ"];

              // ถ้าไม่เจอ ให้ลองหาจากชื่อคอลัมน์ที่มี "ยอดกดถูกใจ" แต่มี whitespace ต่างกัน
              if (
                !rawValue ||
                rawValue === null ||
                rawValue === undefined ||
                (typeof rawValue === "string" && rawValue.trim() === "")
              ) {
                // ลองหาคอลัมน์ที่มีชื่อใกล้เคียงกับ "ยอดกดถูกใจ"
                const allKeys = Object.keys(row);
                const likesKey = allKeys.find(
                  (k) =>
                    k.replace(/\s+/g, "") === "ยอดกดถูกใจ" ||
                    k.trim() === "ยอดกดถูกใจ" ||
                    k.includes("ยอดกดถูกใจ") ||
                    k.includes("ถูกใจ")
                );
                if (likesKey) {
                  rawValue = row[likesKey];
                }

                // ถ้ายังไม่มี ให้ลองชื่ออื่นๆ
                if (
                  !rawValue ||
                  rawValue === null ||
                  rawValue === undefined ||
                  (typeof rawValue === "string" && rawValue.trim() === "")
                ) {
                  rawValue = getValue(row, "Likes", "likes", "ถูกใจ");
                }
              }

              return rawValue;
            })(),
            orders: (() => {
              // อ่านโดยตรงจาก "ยอดการสั่งซื้อ (เช็คระบบหลังบ้าน)" ก่อน
              let rawValue = row["ยอดการสั่งซื้อ (เช็คระบบหลังบ้าน)"];

              // ถ้าไม่มี ให้ลองชื่ออื่นๆ
              if (!rawValue || rawValue === null || rawValue === undefined) {
                rawValue = getValue(
                  row,
                  "การสั่งซื้อ (เช็คระบบหลัง)",
                  "การสั่งซื้อ",
                  "Orders",
                  "orders",
                  "สั่งซื้อ"
                );
              }

              return rawValue;
            })(),
            totalAmount: (() => {
              // อ่านโดยตรงจาก "ยอดรวม" ก่อน
              let rawValue = row["ยอดรวม"];

              // ถ้าไม่มี ให้ลองชื่ออื่นๆ
              if (
                !rawValue ||
                rawValue === null ||
                rawValue === undefined ||
                (typeof rawValue === "string" && rawValue.trim() === "")
              ) {
                // ลองหาคอลัมน์ที่มีชื่อใกล้เคียงกับ "ยอดรวม"
                const allKeys = Object.keys(row);
                const totalKey = allKeys.find(
                  (k) =>
                    k.replace(/\s+/g, "") === "ยอดรวม" || k.trim() === "ยอดรวม"
                );
                if (totalKey) {
                  rawValue = row[totalKey];
                }

                // ถ้ายังไม่มี ให้ลองชื่ออื่นๆ
                if (
                  !rawValue ||
                  rawValue === null ||
                  rawValue === undefined ||
                  (typeof rawValue === "string" && rawValue.trim() === "")
                ) {
                  rawValue = getValue(row, "Total Amount", "totalAmount");
                }
              }

              return rawValue;
            })(),
            addToCart: (() => {
              const rawValue = getValue(
                row,
                "ยอดการกดลงในตะกร้า",
                "ยอดการกดลงตะกร้า",
                "Add to Cart",
                "การกดลงตะกร้า",
                "addToCart",
                "ตะกร้า"
              );
              return rawValue;
            })(),
            shares: (() => {
              const rawValue = getValue(
                row,
                "ยอดการกดแชร์",
                "Shares",
                "shares",
                "แชร์"
              );
              return rawValue;
            })(),
            imageLink: getValue(
              row,
              "แนบ รูป",
              "แนบรูป",
              "Image Link",
              "imageLink",
              "ลิงก์รูป"
            ),
            notes: getValue(
              row,
              "หมายเหตุ",
              "Notes",
              "notes",
              "หมายเหตุ (ผู้ทำสถิติ)"
            ),
          };

          // ถ้ามี duration จาก Excel ให้ใช้ ถ้าไม่มีให้คำนวณจาก startTime และ endTime
          const duration =
            rawData.duration ||
            calculateDuration(rawData.startTime, rawData.endTime);

          // แปลงค่า K เป็นตัวเลขจริงสำหรับฟิลด์ที่เป็นตัวเลข
          // สำหรับฟิลด์ที่เป็นตัวเลข ให้แปลงค่า K เป็นตัวเลข
          // สำหรับฟิลด์ที่อาจเป็น string ธรรมดา ให้เก็บไว้เป็น string (เช่น orders)
          const processedData = {
            ...rawData,
            duration,
            // แปลง customerReach, likes, addToCart, shares ถ้ามี K (เก็บเป็น string ถ้าว่าง)
            customerReach: rawData.customerReach
              ? convertKToNumber(rawData.customerReach)
              : "",
            likes: rawData.likes ? convertKToNumber(rawData.likes) : "",
            addToCart: rawData.addToCart
              ? convertKToNumber(rawData.addToCart)
              : "",
            shares: rawData.shares ? convertKToNumber(rawData.shares) : "",
            // totalAmount แปลงเป็นตัวเลขเสมอ (หรือ 0 ถ้าว่าง เพื่อหลีกเลี่ยง NaN)
            totalAmount: rawData.totalAmount
              ? convertKToNumber(rawData.totalAmount)
              : 0,
          };

          return processedData;
        });

        resolve(convertedRecords);
      } catch (error) {
        reject(new Error("เกิดข้อผิดพลาดในการอ่านไฟล์: " + error.message));
      }
    };

    reader.onerror = (error) =>
      reject(new Error("เกิดข้อผิดพลาดในการอ่านไฟล์"));

    reader.readAsArrayBuffer(file);
  });
};

// Import หลาย records พร้อมกัน (รองรับโปรไฟล์)
export const importMultipleRecords = (records, profileId = null) => {
  const existingRecords = getAllLiveRecords(profileId);
  const newRecords = records.map((data) => createLiveRecord(data));
  const allRecords = [...existingRecords, ...newRecords];
  saveAllLiveRecords(allRecords, profileId);
  return newRecords;
};

// ลบข้อมูลทั้งหมด (รองรับโปรไฟล์)
export const deleteAllLiveRecords = (profileId = null) => {
  if (typeof window === "undefined") return false;

  try {
    if (profileId) {
      const storageKey = `${STORAGE_KEY}_${profileId}`;
      localStorage.removeItem(storageKey);
      // อัปเดตจำนวน records ในโปรไฟล์
      updateProfile(profileId, { recordCount: 0 });
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    return true;
  } catch (error) {
    console.error("Error deleting all data:", error);
    return false;
  }
};

// คำนวณสถิติของโปรไฟล์
export const getProfileStats = (profileId) => {
  const records = getAllLiveRecords(profileId);

  return {
    totalRecords: records.length,
    uniqueStreamers: new Set(records.map((r) => r.streamerName).filter(Boolean))
      .size,
    totalOrders: records.reduce((sum, r) => {
      const orders = parseInt(r.orders) || 0;
      return sum + orders;
    }, 0),
    totalAmount: records.reduce((sum, r) => {
      const amount = parseFloat(
        r.totalAmount?.toString().replace(/,/g, "") || "0"
      );
      return sum + amount;
    }, 0),
    platforms: [...new Set(records.map((r) => r.platform).filter(Boolean))],
  };
};
