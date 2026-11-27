/**
 * KRL Density MVP - Calculator, Density Classification & Time Helper Module
 * Dokumen Acuan: PRD MVP Versi 4.1 Bab 7 & Instruksi QC Tahap 4
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../config/constants'));
  } else {
    root.KRL = root.KRL || {};
    root.KRL.Calculator = factory(root.KRL.Constants);
  }
})(typeof self !== 'undefined' ? self : this, function (Constants) {
  'use strict';

  var DEFAULT_CAPACITY = (Constants && Constants.CAPACITY_PER_CARRIAGE) || 250;

  /**
   * Menghitung persentase kepadatan gerbong.
   * Rumus: (passengerCount / capacity) * 100
   * 
   * @param {number} passengerCount - Jumlah penumpang (harus angka non-negatif)
   * @param {number} [capacity=250] - Kapasitas gerbong (default 250)
   * @returns {number|null} Persentase dengan presisi 1 desimal (contoh: 31.2, 104.0), atau null jika input invalid.
   */
  function calculateOccupancy(passengerCount, capacity) {
    var cap = (typeof capacity === 'number') ? capacity : DEFAULT_CAPACITY;

    // Validasi tipe dan batas numerik
    if (typeof passengerCount !== 'number' || isNaN(passengerCount) || !isFinite(passengerCount)) {
      return null;
    }
    if (passengerCount < 0) {
      return null;
    }
    if (typeof cap !== 'number' || isNaN(cap) || !isFinite(cap) || cap <= 0) {
      return null;
    }

    // Perhitungan asli sebelum pembulatan
    var rawPercent = (passengerCount / cap) * 100;
    
    // Pembulatan standar 1 angka di belakang koma (contoh: 31.2)
    return Math.round(rawPercent * 10) / 10;
  }

  /**
   * Mengklasifikasikan persentase kepadatan ke dalam kategori PRD v4.1.
   * 
   * Aturan:
   * - 0% s.d. 50.0%          = Rendah (Hijau)
   * - > 50.0% s.d. 80.0%     = Sedang (Kuning)
   * - > 80.0% s.d. 100.0%    = Tinggi (Merah)
   * - > 100.0%               = Tinggi + Melebihi Kapasitas
   * 
   * @param {number} occupancyPercent - Nilai persentase kepadatan (contoh: 50.0, 50.4, 80.0, 100.4)
   * @returns {Object|null} Objek kategori atau null jika input invalid.
   */
  function classifyDensity(occupancyPercent) {
    if (typeof occupancyPercent !== 'number' || isNaN(occupancyPercent) || !isFinite(occupancyPercent) || occupancyPercent < 0) {
      return null;
    }

    var isOverCapacity = occupancyPercent > 100.0;
    var categoryId;
    var label;
    var colorName;
    var colorHex;
    var cssClass;

    if (occupancyPercent <= 50.0) {
      categoryId = 'LOW';
      label = 'Rendah';
      colorName = 'Hijau';
      colorHex = '#16a34a';
      cssClass = 'density-low';
    } else if (occupancyPercent <= 80.0) {
      categoryId = 'MEDIUM';
      label = 'Sedang';
      colorName = 'Kuning';
      colorHex = '#ca8a04';
      cssClass = 'density-medium';
    } else {
      categoryId = 'HIGH';
      colorName = 'Merah';
      colorHex = '#dc2626';
      cssClass = 'density-high';
      
      if (isOverCapacity) {
        label = 'Tinggi - Melebihi Kapasitas';
      } else {
        label = 'Tinggi';
      }
    }

    return {
      categoryId: categoryId,
      label: label,
      colorName: colorName,
      colorHex: colorHex,
      cssClass: cssClass,
      isOverCapacity: isOverCapacity
    };
  }

  /**
   * Memformat angka persentase ke format teks tampilan Indonesia (koma sebagai desimal).
   * Contoh: 31.2 -> "31,2%"
   * 
   * @param {number} percent 
   * @returns {string}
   */
  function formatPercentDisplay(percent) {
    if (typeof percent !== 'number' || isNaN(percent)) {
      return '--%';
    }
    return percent.toFixed(1).replace('.', ',') + '%';
  }

  /**
   * Mengonversi ISO String atau timestamp ms ke format jam WIB (Asia/Jakarta).
   * Contoh: "08:30:15 WIB"
   * 
   * @param {string|number|Date} dateOrIso 
   * @returns {string}
   */
  function formatWibTime(dateOrIso) {
    if (!dateOrIso) return '--:--:-- WIB';
    try {
      var d = (typeof dateOrIso === 'string' || typeof dateOrIso === 'number') ? new Date(dateOrIso) : dateOrIso;
      if (isNaN(d.getTime())) return '--:--:-- WIB';
      return d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false }) + ' WIB';
    } catch (e) {
      return String(dateOrIso);
    }
  }

  /**
   * Mengonversi ISO String atau timestamp ms ke format tanggal & jam WIB lengkap.
   * Contoh: "22/11/2026, 08:30:15 WIB"
   * 
   * @param {string|number|Date} dateOrIso 
   * @returns {string}
   */
  function formatWibDateTime(dateOrIso) {
    if (!dateOrIso) return '--/--/----, --:--:-- WIB';
    try {
      var d = (typeof dateOrIso === 'string' || typeof dateOrIso === 'number') ? new Date(dateOrIso) : dateOrIso;
      if (isNaN(d.getTime())) return '--/--/----, --:--:-- WIB';
      return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false }) + ' WIB';
    } catch (e) {
      return String(dateOrIso);
    }
  }

  return {
    calculateOccupancy: calculateOccupancy,
    classifyDensity: classifyDensity,
    formatPercentDisplay: formatPercentDisplay,
    formatWibTime: formatWibTime,
    formatWibDateTime: formatWibDateTime
  };
});
