/**
 * KRL Density MVP - Constants
 * Dokumen Acuan: PRD MVP Versi 4.1 (22 November 2026)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KRL = root.KRL || {};
    root.KRL.Constants = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return Object.freeze({
    SYSTEM_NAME: 'Sistem Informasi Kepadatan Gerbong KRL Yogyakarta–Solo',
    DISCLAIMER_TEXT: 'SIMULASI / ASUMSI — BUKAN DATA REAL-TIME KRL',
    SOURCE_TYPE: 'SIMULATION / ASSUMPTION',
    TIMEZONE: 'Asia/Jakarta',
    TIMEZONE_LABEL: 'WIB',
    
    // Identitas Trip & Kereta
    TRAINSET_ID: 'SIM-TS-01',
    TRIP_ID: 'SIM-TRIP-001',
    DIRECTION: 'Yogyakarta → Palur',
    ORIGIN_STATION: 'Yogyakarta',
    DESTINATION_STATION: 'Palur',
    
    // Daftar Stasiun Resmi KRL Yogyakarta–Solo (Urut Barat ke Timur)
    STATIONS: Object.freeze([
      'Yogyakarta',
      'Lempuyangan',
      'Maguwo',
      'Brambanan',
      'Srowot',
      'Klaten',
      'Ceper',
      'Delanggu',
      'Gawok',
      'Purwosari',
      'Solo Balapan',
      'Solo Jebres',
      'Palur'
    ]),

    // Rincian Lengkap Stasiun KRL Yogyakarta–Solo (Kode, Transit, & Lokasi)
    STATION_DETAILS: Object.freeze([
      Object.freeze({ code: 'YK', name: 'Yogyakarta', alias: 'Tugu', city: 'Kota Yogyakarta', isTransit: true, transitDesc: 'Transit Bandara YIA & KA Jarak Jauh', order: 0 }),
      Object.freeze({ code: 'LPN', name: 'Lempuyangan', alias: 'Lempuyangan', city: 'Kota Yogyakarta', isTransit: false, transitDesc: '', order: 1 }),
      Object.freeze({ code: 'MGW', name: 'Maguwo', alias: 'Bandara Adisutjipto', city: 'Kab. Sleman', isTransit: true, isAirport: true, transitDesc: 'Akses Bandara Adisutjipto', order: 2 }),
      Object.freeze({ code: 'BBN', name: 'Brambanan', alias: 'Prambanan', city: 'Kab. Klaten', isTransit: false, transitDesc: '', order: 3 }),
      Object.freeze({ code: 'SWT', name: 'Srowot', alias: 'Srowot', city: 'Kab. Klaten', isTransit: false, transitDesc: '', order: 4 }),
      Object.freeze({ code: 'KT', name: 'Klaten', alias: 'Klaten', city: 'Kab. Klaten', isTransit: false, transitDesc: '', order: 5 }),
      Object.freeze({ code: 'CE', name: 'Ceper', alias: 'Ceper', city: 'Kab. Klaten', isTransit: false, transitDesc: '', order: 6 }),
      Object.freeze({ code: 'DL', name: 'Delanggu', alias: 'Delanggu', city: 'Kab. Klaten', isTransit: false, transitDesc: '', order: 7 }),
      Object.freeze({ code: 'GW', name: 'Gawok', alias: 'Gawok', city: 'Kab. Sukoharjo', isTransit: false, transitDesc: '', order: 8 }),
      Object.freeze({ code: 'PWS', name: 'Purwosari', alias: 'Purwosari', city: 'Kota Surakarta', isTransit: false, transitDesc: '', order: 9 }),
      Object.freeze({ code: 'SLO', name: 'Solo Balapan', alias: 'Balapan', city: 'Kota Surakarta', isTransit: true, transitDesc: 'Transit KA Bandara BIAS & KA Jarak Jauh', order: 10 }),
      Object.freeze({ code: 'SK', name: 'Solo Jebres', alias: 'Jebres', city: 'Kota Surakarta', isTransit: false, transitDesc: '', order: 11 }),
      Object.freeze({ code: 'PL', name: 'Palur', alias: 'Palur', city: 'Kab. Karanganyar', isTransit: false, transitDesc: '', order: 12 })
    ]),

    // Kredensial Default Simulasi Admin (Prototipe Akademik)
    ADMIN_SIMULATION: Object.freeze({
      DEFAULT_USERNAME: 'admin',
      DEFAULT_PASSWORD: 'admin123',
      ROLE_LABEL: 'Petugas / Administrator KRL',
      IS_PROTOTYPE_SIMULATION: true,
      SECURITY_DISCLAIMER: 'PERINGATAN: Autentikasi ini adalah simulasi di sisi browser untuk prototipe akademik dan tidak menggunakan backend/hash keamanan nyata.'
    }),

    // Konfigurasi Gerbong & Kapasitas Asumsi (PRD Bab 8.1 & 8.2)
    CARRIAGE_IDS: Object.freeze(['K1', 'K2', 'K3', 'K4', 'K5', 'K6']),
    CARRIAGE_COUNT: 6,
    CAPACITY_PER_CARRIAGE: 250,
    TOTAL_CAPACITY: 1500,

    // Konfigurasi Timer & Skenario Simulasi (PRD Bab 9 & Tahap 3-4)
    SCENARIO_ORDER: Object.freeze(['LOW', 'MEDIUM', 'HIGH']),
    SCENARIO_DURATION_SEC: 180, // 3 Menit per skenario
    UPDATE_INTERVAL_SEC: 10,    // Update data setiap 10 detik
    TICKS_PER_SCENARIO: 18,     // 180 / 10 = 18 update per skenario
    CYCLE_DURATION_SEC: 540,    // 9 Menit per siklus penuh
    MAX_HISTORY_CYCLES: 10,     // Batas retensi maksimal 10 siklus terakhir

    // Ambang Batas Kepadatan (Persentase)
    THRESHOLDS: Object.freeze({
      LOW_MAX: 50.0,       // <= 50.0% = Rendah
      MEDIUM_MAX: 80.0,    // > 50.0% s.d. <= 80.0% = Sedang
      HIGH_MIN: 80.0,      // > 80.0% = Tinggi
      OVER_CAPACITY: 100.0 // > 100.0% = Melebihi Kapasitas
    }),

    // Kategori & Warna
    CATEGORIES: Object.freeze({
      LOW: {
        id: 'LOW',
        name: 'Rendah',
        colorName: 'Hijau',
        colorHex: '#16a34a',
        cssClass: 'density-low'
      },
      MEDIUM: {
        id: 'MEDIUM',
        name: 'Sedang',
        colorName: 'Kuning',
        colorHex: '#ca8a04',
        cssClass: 'density-medium'
      },
      HIGH: {
        id: 'HIGH',
        name: 'Tinggi',
        colorName: 'Merah',
        colorHex: '#dc2626',
        cssClass: 'density-high'
      },
      OVER_CAPACITY: {
        id: 'OVER_CAPACITY',
        name: 'Tinggi - Melebihi Kapasitas',
        colorName: 'Merah Peringatan',
        colorHex: '#b91c1c',
        cssClass: 'density-over'
      }
    }),

    // Kunci Penyimpanan LocalStorage
    STORAGE_KEYS: Object.freeze({
      SNAPSHOTS: 'krl_density_snapshots',
      SCENARIO_SUMMARIES: 'krl_density_scenario_summaries',
      CYCLE_SUMMARIES: 'krl_density_cycle_summaries',
      TRANSITION_LOGS: 'krl_density_transition_logs',
      SCHEDULES: 'krl_density_schedules',
      ACTIVE_SCHEDULE_ID: 'krl_density_active_schedule_id',
      ADMIN_SESSION: 'krl_admin_session'
    }),

    // Status Mesin Simulasi
    ENGINE_STATUS: Object.freeze({
      STOPPED: 'STOPPED',
      RUNNING: 'RUNNING',
      STOPPING_AFTER_SCENARIO: 'STOPPING_AFTER_SCENARIO'
    }),

    // Pesan Peringatan & Status
    MESSAGES: Object.freeze({
      STATUS_STOPPED: 'Berhenti',
      STATUS_RUNNING: 'Berjalan',
      STATUS_STOPPING: 'Menunggu penyelesaian skenario',
      MOST_RECOMMENDED: 'Paling Direkomendasikan',
      OVER_CAPACITY_WARNING: 'Melebihi Kapasitas',
      ALL_HIGH_WARNING: 'Semua gerbong berkepadatan tinggi',
      DATA_UNAVAILABLE: 'Data Tidak Tersedia',
      DISCLAIMER_FOOTER: 'Data ini adalah data simulasi/asumsi untuk tugas akademik, bukan data operasional resmi KAI Commuter.'
    })
  });
});
