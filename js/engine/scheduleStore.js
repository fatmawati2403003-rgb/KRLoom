/**
 * KRL Density MVP - Schedule Storage & Search Module
 * Dokumen Acuan: PRD MVP v4.1 & Fitur Ekstensi Jadwal KRL
 * 
 * BATASAN DATA & SIMULASI:
 * Seluruh data jadwal (nomor kereta, jam, stasiun, kepadatan) adalah data simulasi / sintetis
 * untuk prototipe akademik. Penyimpanan menggunakan LocalStorage browser dan bukan database terpusat.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../config/constants'),
      require('../config/presets')
    );
  } else {
    root.KRL = root.KRL || {};
    root.KRL.ScheduleStore = factory(
      root.KRL.Constants,
      root.KRL.Presets
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Constants, Presets) {
  'use strict';

  var STORAGE_KEY = (Constants && Constants.STORAGE_KEYS && Constants.STORAGE_KEYS.SCHEDULES) || 'krl_density_schedules';
  var ACTIVE_ID_KEY = (Constants && Constants.STORAGE_KEYS && Constants.STORAGE_KEYS.ACTIVE_SCHEDULE_ID) || 'krl_density_active_schedule_id';

  var STATIONS = (Constants && Constants.STATIONS) || [
    'Yogyakarta', 'Lempuyangan', 'Maguwo', 'Brambanan', 'Srowot',
    'Klaten', 'Ceper', 'Delanggu', 'Gawok', 'Purwosari',
    'Solo Balapan', 'Solo Jebres', 'Palur'
  ];

  var STATION_DETAILS = (Constants && Constants.STATION_DETAILS) || [
    { code: 'YK', name: 'Yogyakarta', alias: 'Tugu', city: 'Kota Yogyakarta', isTransit: true, transitDesc: 'Transit Bandara YIA & KA Jarak Jauh', order: 0 },
    { code: 'LPN', name: 'Lempuyangan', alias: 'Lempuyangan', city: 'Kota Yogyakarta', isTransit: false, transitDesc: '', order: 1 },
    { code: 'MGW', name: 'Maguwo', alias: 'Bandara Adisutjipto', city: 'Kab. Sleman', isTransit: true, isAirport: true, transitDesc: 'Akses Bandara Adisutjipto', order: 2 },
    { code: 'BBN', name: 'Brambanan', alias: 'Prambanan', city: 'Kab. Klaten', isTransit: false, transitDesc: '', order: 3 },
    { code: 'SWT', name: 'Srowot', alias: 'Srowot', city: 'Kab. Klaten', isTransit: false, transitDesc: '', order: 4 },
    { code: 'KT', name: 'Klaten', alias: 'Klaten', city: 'Kab. Klaten', isTransit: false, transitDesc: '', order: 5 },
    { code: 'CE', name: 'Ceper', alias: 'Ceper', city: 'Kab. Klaten', isTransit: false, transitDesc: '', order: 6 },
    { code: 'DL', name: 'Delanggu', alias: 'Delanggu', city: 'Kab. Klaten', isTransit: false, transitDesc: '', order: 7 },
    { code: 'GW', name: 'Gawok', alias: 'Gawok', city: 'Kab. Sukoharjo', isTransit: false, transitDesc: '', order: 8 },
    { code: 'PWS', name: 'Purwosari', alias: 'Purwosari', city: 'Kota Surakarta', isTransit: false, transitDesc: '', order: 9 },
    { code: 'SLO', name: 'Solo Balapan', alias: 'Balapan', city: 'Kota Surakarta', isTransit: true, transitDesc: 'Transit KA Bandara BIAS & KA Jarak Jauh', order: 10 },
    { code: 'SK', name: 'Solo Jebres', alias: 'Jebres', city: 'Kota Surakarta', isTransit: false, transitDesc: '', order: 11 },
    { code: 'PL', name: 'Palur', alias: 'Palur', city: 'Kab. Karanganyar', isTransit: false, transitDesc: '', order: 12 }
  ];

  /**
   * Mencari stasiun berdasarkan nama, kode, alias, atau kota.
   * Mendukung rekomendasi saat pengguna mengetik nama stasiun.
   * 
   * @param {string} [query] - Kata kunci pencarian (nama atau kode stasiun)
   * @returns {Array<Object>} Daftar stasiun yang cocok
   */
  function searchStations(query) {
    if (!query || typeof query !== 'string') {
      return STATION_DETAILS.slice();
    }
    var q = query.trim().toLowerCase();
    if (!q) {
      return STATION_DETAILS.slice();
    }
    return STATION_DETAILS.filter(function (s) {
      var nameMatch = s.name.toLowerCase().indexOf(q) !== -1;
      var codeMatch = s.code.toLowerCase().indexOf(q) !== -1;
      var aliasMatch = s.alias && s.alias.toLowerCase().indexOf(q) !== -1;
      var cityMatch = s.city && s.city.toLowerCase().indexOf(q) !== -1;
      return nameMatch || codeMatch || aliasMatch || cityMatch;
    });
  }

  /**
   * Mengambil detail satu stasiun berdasarkan nama atau kode stasiun.
   * 
   * @param {string} nameOrCode 
   * @returns {Object|null}
   */
  function getStationDetail(nameOrCode) {
    if (!nameOrCode) return null;
    var term = (nameOrCode + '').trim().toLowerCase();
    for (var i = 0; i < STATION_DETAILS.length; i++) {
      if (STATION_DETAILS[i].name.toLowerCase() === term || 
          STATION_DETAILS[i].code.toLowerCase() === term) {
        return STATION_DETAILS[i];
      }
    }
    return null;
  }

  /**
   * Mendapatkan daftar pilihan stasiun tujuan berdasarkan stasiun asal.
   * Menghasilkan rekomendasi rute langsung (seperti pada Access by KAI)
   * serta seluruh daftar stasiun tujuan yang tersedia selain stasiun asal.
   * 
   * @param {string} originStation 
   * @returns {{ origin: string, quickRoutes: Array<Object>, allDestinations: Array<Object> }}
   */
  function getAvailableDestinations(originStation) {
    var origin = (originStation || '').trim();
    var origDet = getStationDetail(origin);
    if (origDet) origin = origDet.name;

    var quickRoutes = [];
    if (origin && origin !== 'Palur') {
      quickRoutes.push({
        destination: 'Palur',
        destCode: 'PL',
        label: 'COMMUTER LINE YOGYAKARTA',
        direction: origin.toUpperCase() + ' → PALUR',
        arrow: 'east'
      });
    }
    if (origin && origin !== 'Yogyakarta') {
      quickRoutes.push({
        destination: 'Yogyakarta',
        destCode: 'YK',
        label: 'COMMUTER LINE YOGYAKARTA',
        direction: origin.toUpperCase() + ' → YOGYAKARTA',
        arrow: 'west'
      });
    }

    var allDestinations = STATION_DETAILS.filter(function (s) {
      return s.name.toLowerCase() !== origin.toLowerCase();
    });

    return {
      origin: origin,
      quickRoutes: quickRoutes,
      allDestinations: allDestinations
    };
  }

  // Data default jadwal simulasi KRL Yogyakarta–Solo (PP)
  var DEFAULT_SCHEDULES = [
    {
      id: 'SCH-001',
      trainNumber: 'KA 102',
      trainCode: '#701',
      tripId: 'SIM-TRIP-001',
      trainsetId: 'SIM-TS-01',
      originStation: 'Yogyakarta',
      destinationStation: 'Palur',
      departureTime: '05:30',
      arrivalTime: '06:55',
      scenario: 'LOW',
      notes: 'Pagi Hari — Data Simulasi (Kepadatan Rendah)',
      carriages: [
        { carriage_id: 'K1', passenger_count: 88, assumed_capacity: 250 },
        { carriage_id: 'K2', passenger_count: 70, assumed_capacity: 250 },
        { carriage_id: 'K3', passenger_count: 105, assumed_capacity: 250 },
        { carriage_id: 'K4', passenger_count: 55, assumed_capacity: 250 },
        { carriage_id: 'K5', passenger_count: 78, assumed_capacity: 250 },
        { carriage_id: 'K6', passenger_count: 112, assumed_capacity: 250 }
      ]
    },
    {
      id: 'SCH-002',
      trainNumber: 'KA 104',
      trainCode: '#711',
      tripId: 'SIM-TRIP-002',
      trainsetId: 'SIM-TS-02',
      originStation: 'Yogyakarta',
      destinationStation: 'Palur',
      departureTime: '06:50',
      arrivalTime: '08:15',
      scenario: 'HIGH',
      notes: 'Jam Sibuk Pagi — Data Simulasi (Kepadatan Tinggi)',
      carriages: [
        { carriage_id: 'K1', passenger_count: 230, assumed_capacity: 250 },
        { carriage_id: 'K2', passenger_count: 220, assumed_capacity: 250 },
        { carriage_id: 'K3', passenger_count: 262, assumed_capacity: 250 },
        { carriage_id: 'K4', passenger_count: 243, assumed_capacity: 250 },
        { carriage_id: 'K5', passenger_count: 210, assumed_capacity: 250 },
        { carriage_id: 'K6', passenger_count: 253, assumed_capacity: 250 }
      ]
    },
    {
      id: 'SCH-003',
      trainNumber: 'KA 106',
      trainCode: '#721',
      tripId: 'SIM-TRIP-003',
      trainsetId: 'SIM-TS-03',
      originStation: 'Yogyakarta',
      destinationStation: 'Solo Balapan',
      departureTime: '08:50',
      arrivalTime: '09:58',
      scenario: 'MEDIUM',
      notes: 'Data Simulasi (Kepadatan Sedang)',
      carriages: [
        { carriage_id: 'K1', passenger_count: 155, assumed_capacity: 250 },
        { carriage_id: 'K2', passenger_count: 188, assumed_capacity: 250 },
        { carriage_id: 'K3', passenger_count: 145, assumed_capacity: 250 },
        { carriage_id: 'K4', passenger_count: 170, assumed_capacity: 250 },
        { carriage_id: 'K5', passenger_count: 135, assumed_capacity: 250 },
        { carriage_id: 'K6', passenger_count: 178, assumed_capacity: 250 }
      ]
    },
    {
      id: 'SCH-004',
      trainNumber: 'KA 108',
      trainCode: '#703',
      tripId: 'SIM-TRIP-004',
      trainsetId: 'SIM-TS-01',
      originStation: 'Yogyakarta',
      destinationStation: 'Palur',
      departureTime: '11:55',
      arrivalTime: '13:17',
      scenario: 'LOW',
      notes: 'Siang Hari — Data Simulasi (Kepadatan Rendah)',
      carriages: [
        { carriage_id: 'K1', passenger_count: 75, assumed_capacity: 250 },
        { carriage_id: 'K2', passenger_count: 65, assumed_capacity: 250 },
        { carriage_id: 'K3', passenger_count: 90, assumed_capacity: 250 },
        { carriage_id: 'K4', passenger_count: 50, assumed_capacity: 250 },
        { carriage_id: 'K5', passenger_count: 82, assumed_capacity: 250 },
        { carriage_id: 'K6', passenger_count: 95, assumed_capacity: 250 }
      ]
    },
    {
      id: 'SCH-005',
      trainNumber: 'KA 110',
      trainCode: '#723',
      tripId: 'SIM-TRIP-005',
      trainsetId: 'SIM-TS-02',
      originStation: 'Yogyakarta',
      destinationStation: 'Palur',
      departureTime: '15:20',
      arrivalTime: '16:42',
      scenario: 'MEDIUM',
      notes: 'Sore Hari — Data Simulasi (Kepadatan Sedang)',
      carriages: [
        { carriage_id: 'K1', passenger_count: 160, assumed_capacity: 250 },
        { carriage_id: 'K2', passenger_count: 175, assumed_capacity: 250 },
        { carriage_id: 'K3', passenger_count: 150, assumed_capacity: 250 },
        { carriage_id: 'K4', passenger_count: 180, assumed_capacity: 250 },
        { carriage_id: 'K5', passenger_count: 140, assumed_capacity: 250 },
        { carriage_id: 'K6', passenger_count: 165, assumed_capacity: 250 }
      ]
    },
    {
      id: 'SCH-006',
      trainNumber: 'KA 112',
      trainCode: '#725',
      tripId: 'SIM-TRIP-006',
      trainsetId: 'SIM-TS-03',
      originStation: 'Yogyakarta',
      destinationStation: 'Palur',
      departureTime: '17:45',
      arrivalTime: '19:07',
      scenario: 'HIGH',
      notes: 'Jam Sibuk Pulang Kerja — Data Simulasi (Kepadatan Tinggi)',
      carriages: [
        { carriage_id: 'K1', passenger_count: 240, assumed_capacity: 250 },
        { carriage_id: 'K2', passenger_count: 225, assumed_capacity: 250 },
        { carriage_id: 'K3', passenger_count: 255, assumed_capacity: 250 },
        { carriage_id: 'K4', passenger_count: 248, assumed_capacity: 250 },
        { carriage_id: 'K5', passenger_count: 215, assumed_capacity: 250 },
        { carriage_id: 'K6', passenger_count: 260, assumed_capacity: 250 }
      ]
    },
    {
      id: 'SCH-007',
      trainNumber: 'KA 101',
      trainCode: '#705',
      tripId: 'SIM-TRIP-007',
      trainsetId: 'SIM-TS-02',
      originStation: 'Palur',
      destinationStation: 'Yogyakarta',
      departureTime: '05:05',
      arrivalTime: '06:27',
      scenario: 'LOW',
      notes: 'Pagi Hari — Arah Barat (Kepadatan Rendah)',
      carriages: [
        { carriage_id: 'K1', passenger_count: 80, assumed_capacity: 250 },
        { carriage_id: 'K2', passenger_count: 68, assumed_capacity: 250 },
        { carriage_id: 'K3', passenger_count: 95, assumed_capacity: 250 },
        { carriage_id: 'K4', passenger_count: 60, assumed_capacity: 250 },
        { carriage_id: 'K5', passenger_count: 72, assumed_capacity: 250 },
        { carriage_id: 'K6', passenger_count: 102, assumed_capacity: 250 }
      ]
    },
    {
      id: 'SCH-008',
      trainNumber: 'KA 103',
      trainCode: '#715',
      tripId: 'SIM-TRIP-008',
      trainsetId: 'SIM-TS-01',
      originStation: 'Palur',
      destinationStation: 'Yogyakarta',
      departureTime: '06:10',
      arrivalTime: '07:35',
      scenario: 'HIGH',
      notes: 'Jam Sibuk Pagi — Arah Barat (Kepadatan Tinggi)',
      carriages: [
        { carriage_id: 'K1', passenger_count: 225, assumed_capacity: 250 },
        { carriage_id: 'K2', passenger_count: 235, assumed_capacity: 250 },
        { carriage_id: 'K3', passenger_count: 258, assumed_capacity: 250 },
        { carriage_id: 'K4', passenger_count: 240, assumed_capacity: 250 },
        { carriage_id: 'K5', passenger_count: 212, assumed_capacity: 250 },
        { carriage_id: 'K6', passenger_count: 250, assumed_capacity: 250 }
      ]
    },
    {
      id: 'SCH-009',
      trainNumber: 'KA 105',
      trainCode: '#707',
      tripId: 'SIM-TRIP-009',
      trainsetId: 'SIM-TS-03',
      originStation: 'Solo Balapan',
      destinationStation: 'Yogyakarta',
      departureTime: '08:53',
      arrivalTime: '10:04',
      scenario: 'MEDIUM',
      notes: 'Data Simulasi (Kepadatan Sedang)',
      carriages: [
        { carriage_id: 'K1', passenger_count: 148, assumed_capacity: 250 },
        { carriage_id: 'K2', passenger_count: 165, assumed_capacity: 250 },
        { carriage_id: 'K3', passenger_count: 140, assumed_capacity: 250 },
        { carriage_id: 'K4', passenger_count: 172, assumed_capacity: 250 },
        { carriage_id: 'K5', passenger_count: 130, assumed_capacity: 250 },
        { carriage_id: 'K6', passenger_count: 160, assumed_capacity: 250 }
      ]
    },
    {
      id: 'SCH-010',
      trainNumber: 'KA 107',
      trainCode: '#727',
      tripId: 'SIM-TRIP-010',
      trainsetId: 'SIM-TS-02',
      originStation: 'Palur',
      destinationStation: 'Yogyakarta',
      departureTime: '13:40',
      arrivalTime: '15:02',
      scenario: 'LOW',
      notes: 'Siang Hari — Arah Barat (Kepadatan Rendah)',
      carriages: [
        { carriage_id: 'K1', passenger_count: 70, assumed_capacity: 250 },
        { carriage_id: 'K2', passenger_count: 58, assumed_capacity: 250 },
        { carriage_id: 'K3', passenger_count: 85, assumed_capacity: 250 },
        { carriage_id: 'K4', passenger_count: 48, assumed_capacity: 250 },
        { carriage_id: 'K5', passenger_count: 65, assumed_capacity: 250 },
        { carriage_id: 'K6', passenger_count: 88, assumed_capacity: 250 }
      ]
    },
    {
      id: 'SCH-011',
      trainNumber: 'KA 109',
      trainCode: '#717',
      tripId: 'SIM-TRIP-011',
      trainsetId: 'SIM-TS-01',
      originStation: 'Palur',
      destinationStation: 'Yogyakarta',
      departureTime: '16:15',
      arrivalTime: '17:39',
      scenario: 'MEDIUM',
      notes: 'Sore Hari — Arah Barat (Kepadatan Sedang)',
      carriages: [
        { carriage_id: 'K1', passenger_count: 165, assumed_capacity: 250 },
        { carriage_id: 'K2', passenger_count: 180, assumed_capacity: 250 },
        { carriage_id: 'K3', passenger_count: 152, assumed_capacity: 250 },
        { carriage_id: 'K4', passenger_count: 176, assumed_capacity: 250 },
        { carriage_id: 'K5', passenger_count: 142, assumed_capacity: 250 },
        { carriage_id: 'K6', passenger_count: 168, assumed_capacity: 250 }
      ]
    },
    {
      id: 'SCH-012',
      trainNumber: 'KA 111',
      trainCode: '#709',
      tripId: 'SIM-TRIP-012',
      trainsetId: 'SIM-TS-03',
      originStation: 'Palur',
      destinationStation: 'Yogyakarta',
      departureTime: '18:05',
      arrivalTime: '19:27',
      scenario: 'HIGH',
      notes: 'Malam Hari — Jam Pulang Kerja (Kepadatan Tinggi)',
      carriages: [
        { carriage_id: 'K1', passenger_count: 235, assumed_capacity: 250 },
        { carriage_id: 'K2', passenger_count: 228, assumed_capacity: 250 },
        { carriage_id: 'K3', passenger_count: 260, assumed_capacity: 250 },
        { carriage_id: 'K4', passenger_count: 245, assumed_capacity: 250 },
        { carriage_id: 'K5', passenger_count: 218, assumed_capacity: 250 },
        { carriage_id: 'K6', passenger_count: 255, assumed_capacity: 250 }
      ]
    }
  ];

  /**
   * Helper membaca schedules dari localStorage.
   */
  function getAll() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Gagal membaca jadwal dari LocalStorage:', e);
    }

    // Jika belum ada di LocalStorage, inisialisasi default dan simpan
    saveAll(DEFAULT_SCHEDULES);
    return JSON.parse(JSON.stringify(DEFAULT_SCHEDULES));
  }

  /**
   * Helper menyimpan seluruh list schedules ke localStorage.
   */
  function saveAll(schedules) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
        return true;
      }
    } catch (e) {
      console.warn('Gagal menyimpan jadwal ke LocalStorage:', e);
    }
    return false;
  }

  /**
   * Mengambil jadwal berdasarkan ID.
   */
  function getById(id) {
    var all = getAll();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) {
        return all[i];
      }
    }
    return null;
  }

  /**
   * Helper menghitung selisih menit antara dua waktu HH:mm
   */
  function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    var parts = timeStr.split(':');
    var h = parseInt(parts[0], 10) || 0;
    var m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  }

  function formatMinutesToTime(mins) {
    mins = (mins + 24 * 60) % (24 * 60);
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return (h < 10 ? '0' + h : '' + h) + ':' + (m < 10 ? '0' + m : '' + m);
  }

  /**
   * Mencari jadwal KRL berdasarkan stasiun asal dan stasiun tujuan.
   * 
   * Validasi:
   * 1. Asal dan tujuan tidak boleh sama.
   * 2. Asal dan tujuan wajib dipilih.
   * 
   * Logika Jalur KRL Yogyakarta–Solo:
   * Kereta melewati stasiun secara berurutan:
   * [Yogyakarta, Lempuyangan, Maguwo, Brambanan, Srowot, Klaten, Ceper, Delanggu, Gawok, Purwosari, Solo Balapan, Solo Jebres, Palur]
   * Sebuah perjalanan melayani rute jika arah jalurnya sesuai (Arah Timur atau Arah Barat)
   * dan mencakup segmen dari stasiun asal ke stasiun tujuan.
   * 
   * @param {string} originStation - Stasiun asal
   * @param {string} destinationStation - Stasiun tujuan
   * @param {string} [travelDate] - Tanggal perjalanan (opsional)
   * @param {Object} [timeFilter] - Pengaturan filter waktu { type, fromTime, untilTime } (opsional)
   * @returns {{ isValid: boolean, error: string|null, results: Array<Object> }}
   */
  function search(originStation, destinationStation, travelDate, timeFilter) {
    var origin = (originStation || '').trim();
    var dest = (destinationStation || '').trim();

    if (!origin || !dest) {
      return {
        isValid: false,
        error: 'Silakan pilih stasiun asal dan stasiun tujuan terlebih dahulu.',
        results: []
      };
    }

    if (origin.toLowerCase() === dest.toLowerCase()) {
      return {
        isValid: false,
        error: 'Stasiun asal dan tujuan tidak boleh sama (' + origin + '). Silakan pilih stasiun tujuan yang berbeda.',
        results: []
      };
    }

    var originIdx = STATIONS.indexOf(origin);
    var destIdx = STATIONS.indexOf(dest);

    // Menentukan arah perjalanan yang dicari pengguna:
    // isEastbound: true jika originIdx < destIdx (Yogya ke arah Solo/Palur)
    // isWestbound: true jika originIdx > destIdx (Palur/Solo ke arah Yogya)
    var isSearchEastbound = (originIdx !== -1 && destIdx !== -1) ? (originIdx < destIdx) : null;

    var allSchedules = getAll();
    var matchedResults = [];

    allSchedules.forEach(function (sch) {
      var schOriginIdx = STATIONS.indexOf(sch.originStation);
      var schDestIdx = STATIONS.indexOf(sch.destinationStation);

      var isSchEastbound = (schOriginIdx !== -1 && schDestIdx !== -1) ? (schOriginIdx < schDestIdx) : null;

      var isMatch = false;
      var estDep = sch.departureTime;
      var estArr = sch.arrivalTime;

      // 1. Kecocokan langsung (exact terminal match)
      if (sch.originStation.toLowerCase() === origin.toLowerCase() && 
          sch.destinationStation.toLowerCase() === dest.toLowerCase()) {
        isMatch = true;
      }
      // 2. Kecocokan segmen rute intermediate pada jalur yang sama
      else if (isSearchEastbound !== null && isSchEastbound !== null && isSearchEastbound === isSchEastbound) {
        if (isSearchEastbound) {
          // Eastbound: kereta jalan dari indeks rendah ke tinggi
          // Jadwal mencakup jika schOriginIdx <= originIdx dan destIdx <= schDestIdx
          if (schOriginIdx <= originIdx && destIdx <= schDestIdx) {
            isMatch = true;
            // Hitung estimasi waktu stasiun antara (rata-rata 6.5 menit antar stasiun)
            var totalSegs = schDestIdx - schOriginIdx;
            var startMins = parseTimeToMinutes(sch.departureTime);
            var endMins = parseTimeToMinutes(sch.arrivalTime);
            var totalDur = endMins >= startMins ? (endMins - startMins) : (endMins + 1440 - startMins);
            var durPerSeg = totalSegs > 0 ? (totalDur / totalSegs) : 6.5;

            var depMins = Math.round(startMins + (originIdx - schOriginIdx) * durPerSeg);
            var arrMins = Math.round(startMins + (destIdx - schOriginIdx) * durPerSeg);
            estDep = formatMinutesToTime(depMins);
            estArr = formatMinutesToTime(arrMins);
          }
        } else {
          // Westbound: kereta jalan dari indeks tinggi ke rendah
          // Jadwal mencakup jika schOriginIdx >= originIdx dan destIdx >= schDestIdx
          if (schOriginIdx >= originIdx && destIdx >= schDestIdx) {
            isMatch = true;
            var totalSegsW = schOriginIdx - schDestIdx;
            var startMinsW = parseTimeToMinutes(sch.departureTime);
            var endMinsW = parseTimeToMinutes(sch.arrivalTime);
            var totalDurW = endMinsW >= startMinsW ? (endMinsW - startMinsW) : (endMinsW + 1440 - startMinsW);
            var durPerSegW = totalSegsW > 0 ? (totalDurW / totalSegsW) : 6.5;

            var depMinsW = Math.round(startMinsW + (schOriginIdx - originIdx) * durPerSegW);
            var arrMinsW = Math.round(startMinsW + (schOriginIdx - destIdx) * durPerSegW);
            estDep = formatMinutesToTime(depMinsW);
            estArr = formatMinutesToTime(arrMinsW);
          }
        }
      }

      if (isMatch) {
        var startM = parseTimeToMinutes(estDep);
        var endM = parseTimeToMinutes(estArr);
        var durMin = endM >= startM ? (endM - startM) : (endM + 1440 - startM);
        var durStr = Math.floor(durMin / 60) > 0 ? 
          (Math.floor(durMin / 60) + 'j ' + (durMin % 60) + 'm') : (durMin + 'm');

        var trainCode = sch.trainCode || ('#' + (sch.trainNumber ? sch.trainNumber.replace(/\D/g, '') : ''));

        matchedResults.push({
          id: sch.id,
          trainNumber: sch.trainNumber,
          trainCode: trainCode,
          displayTrainName: trainCode ? (trainCode + ' • ' + sch.trainNumber) : sch.trainNumber,
          tripId: sch.tripId,
          trainsetId: sch.trainsetId,
          fullOrigin: sch.originStation,
          fullDestination: sch.destinationStation,
          searchOrigin: origin,
          searchDestination: dest,
          departureTime: estDep,
          arrivalTime: estArr,
          durationDisplay: durStr,
          scenario: sch.scenario || 'MEDIUM',
          notes: sch.notes || 'Data Simulasi',
          carriages: sch.carriages,
          travelDate: travelDate || new Date().toISOString().split('T')[0]
        });
      }
    });

    // Urutkan berdasarkan waktu keberangkatan
    matchedResults.sort(function (a, b) {
      return parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime);
    });

    // Terapkan filter rentang waktu keberangkatan jika ada
    if (timeFilter && (timeFilter.fromTime || timeFilter.untilTime)) {
      var fFrom = parseTimeToMinutes(timeFilter.fromTime || '00:00');
      var fUntil = parseTimeToMinutes(timeFilter.untilTime || '23:59');
      matchedResults = matchedResults.filter(function (item) {
        var depM = parseTimeToMinutes(item.departureTime);
        if (fFrom <= fUntil) {
          return depM >= fFrom && depM <= fUntil;
        } else {
          return depM >= fFrom || depM <= fUntil;
        }
      });
    }

    return {
      isValid: true,
      error: null,
      results: matchedResults
    };
  }

  /**
   * Menambahkan jadwal baru (CRUD Admin).
   */
  function add(data) {
    if (!data.trainNumber || !data.originStation || !data.destinationStation || !data.departureTime || !data.arrivalTime) {
      return { success: false, message: 'Kolom nomor KA, stasiun asal, stasiun tujuan, jam berangkat, dan jam tiba wajib diisi.' };
    }
    if (data.originStation.trim().toLowerCase() === data.destinationStation.trim().toLowerCase()) {
      return { success: false, message: 'Stasiun asal dan stasiun tujuan tidak boleh sama.' };
    }

    var all = getAll();
    var newId = 'SCH-' + ('000' + (all.length + 1)).slice(-3) + '-' + Math.floor(Math.random() * 1000);
    
    // Siapkan data default gerbong jika tidak disertakan
    var carriages = data.carriages;
    if (!carriages || !Array.isArray(carriages) || carriages.length !== 6) {
      var presetScenario = data.scenario || 'MEDIUM';
      var presetPass = Presets && Presets.SCENARIO_PRESETS && Presets.SCENARIO_PRESETS[presetScenario] ?
        Presets.SCENARIO_PRESETS[presetScenario].passengers :
        { K1: 150, K2: 150, K3: 150, K4: 150, K5: 150, K6: 150 };
      
      carriages = (Constants.CARRIAGE_IDS || ['K1','K2','K3','K4','K5','K6']).map(function (cid) {
        return {
          carriage_id: cid,
          passenger_count: presetPass[cid] || 150,
          assumed_capacity: Constants.CAPACITY_PER_CARRIAGE || 250
        };
      });
    }

    var newSchedule = {
      id: newId,
      trainNumber: data.trainNumber.trim(),
      tripId: data.tripId ? data.tripId.trim() : 'SIM-TRIP-' + Math.floor(100 + Math.random() * 900),
      trainsetId: data.trainsetId ? data.trainsetId.trim() : 'SIM-TS-' + Math.floor(10 + Math.random() * 90),
      originStation: data.originStation.trim(),
      destinationStation: data.destinationStation.trim(),
      departureTime: data.departureTime.trim(),
      arrivalTime: data.arrivalTime.trim(),
      scenario: data.scenario || 'MEDIUM',
      notes: data.notes ? data.notes.trim() : 'Data Simulasi Ditambahkan Petugas',
      carriages: carriages
    };

    all.push(newSchedule);
    saveAll(all);

    return {
      success: true,
      message: 'Jadwal ' + newSchedule.trainNumber + ' (' + newSchedule.originStation + ' → ' + newSchedule.destinationStation + ') berhasil ditambahkan.',
      schedule: newSchedule
    };
  }

  /**
   * Mengubah jadwal yang ada (CRUD Admin).
   */
  function update(id, updatedData) {
    var all = getAll();
    var idx = -1;
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) {
        idx = i;
        break;
      }
    }

    if (idx === -1) {
      return { success: false, message: 'Jadwal dengan ID ' + id + ' tidak ditemukan.' };
    }

    if (updatedData.originStation && updatedData.destinationStation &&
        updatedData.originStation.trim().toLowerCase() === updatedData.destinationStation.trim().toLowerCase()) {
      return { success: false, message: 'Stasiun asal dan stasiun tujuan tidak boleh sama.' };
    }

    var sch = all[idx];
    if (updatedData.trainNumber) sch.trainNumber = updatedData.trainNumber.trim();
    if (updatedData.tripId) sch.tripId = updatedData.tripId.trim();
    if (updatedData.trainsetId) sch.trainsetId = updatedData.trainsetId.trim();
    if (updatedData.originStation) sch.originStation = updatedData.originStation.trim();
    if (updatedData.destinationStation) sch.destinationStation = updatedData.destinationStation.trim();
    if (updatedData.departureTime) sch.departureTime = updatedData.departureTime.trim();
    if (updatedData.arrivalTime) sch.arrivalTime = updatedData.arrivalTime.trim();
    if (updatedData.scenario) sch.scenario = updatedData.scenario;
    if (updatedData.notes !== undefined) sch.notes = updatedData.notes.trim();

    // Jika skenario diubah, perbarui gerbong jika diminta
    if (updatedData.updateCarriagesWithScenario && updatedData.scenario) {
      var presetPass = Presets && Presets.SCENARIO_PRESETS && Presets.SCENARIO_PRESETS[updatedData.scenario] ?
        Presets.SCENARIO_PRESETS[updatedData.scenario].passengers : null;
      if (presetPass) {
        sch.carriages = (Constants.CARRIAGE_IDS || ['K1','K2','K3','K4','K5','K6']).map(function (cid) {
          return {
            carriage_id: cid,
            passenger_count: presetPass[cid] || 150,
            assumed_capacity: Constants.CAPACITY_PER_CARRIAGE || 250
          };
        });
      }
    }

    all[idx] = sch;
    saveAll(all);

    return {
      success: true,
      message: 'Jadwal ' + sch.trainNumber + ' berhasil diperbarui.',
      schedule: sch
    };
  }

  /**
   * Menghapus jadwal berdasarkan ID (CRUD Admin).
   */
  function deleteSchedule(id) {
    var all = getAll();
    var filtered = all.filter(function (s) { return s.id !== id; });

    if (filtered.length === all.length) {
      return { success: false, message: 'Jadwal dengan ID ' + id + ' tidak ditemukan.' };
    }

    saveAll(filtered);
    return {
      success: true,
      message: 'Jadwal berhasil dihapus dari sistem.'
    };
  }

  /**
   * Reset seluruh jadwal ke preset awal.
   */
  function resetDefaults() {
    saveAll(DEFAULT_SCHEDULES);
    return {
      success: true,
      message: 'Jadwal telah di-reset ke preset awal simulasi.',
      schedules: JSON.parse(JSON.stringify(DEFAULT_SCHEDULES))
    };
  }

  /**
   * Mengambil / Mengatur Trip Aktif untuk Penumpang
   */
  function getActiveTrip() {
    var activeId = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        activeId = window.localStorage.getItem(ACTIVE_ID_KEY);
      }
    } catch (e) {}

    if (activeId) {
      var found = getById(activeId);
      if (found) return found;
    }
    // Default kembalikan jadwal pertama
    var all = getAll();
    return all.length > 0 ? all[0] : null;
  }

  function setActiveTrip(id) {
    var item = getById(id);
    if (!item) return false;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(ACTIVE_ID_KEY, id);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Menghasilkan rute perjalanan lengkap (stasiun demi stasiun) dari stasiun awal ke stasiun akhir kereta
   * untuk visualisasi timeline rute vertikal (View Route) seperti pada Access by KAI.
   * 
   * @param {string|Object} scheduleOrId - Objek jadwal atau ID jadwal
   * @param {string} [userOrigin] - Stasiun keberangkatan pilihan pengguna (untuk highlight You Are Here)
   * @param {string} [userDestination] - Stasiun tujuan pilihan pengguna (untuk highlight Destination)
   * @returns {Object|null} Objek detail rute lengkap
   */
  function getTrainRouteDetails(scheduleOrId, userOrigin, userDestination) {
    var sch = typeof scheduleOrId === 'object' ? scheduleOrId : getById(scheduleOrId);
    if (!sch) return null;

    var schOriginIdx = STATIONS.indexOf(sch.originStation);
    var schDestIdx = STATIONS.indexOf(sch.destinationStation);
    var isEastbound = schOriginIdx < schDestIdx;

    var userOrigName = (userOrigin || '').trim();
    var userDestName = (userDestination || '').trim();

    // Normalisasi jika input berupa kode stasiun (misal YK -> Yogyakarta)
    var origDet = getStationDetail(userOrigName);
    if (origDet) userOrigName = origDet.name;
    var destDet = getStationDetail(userDestName);
    if (destDet) userDestName = destDet.name;

    var userOrigIdx = STATIONS.indexOf(userOrigName);
    var userDestIdx = STATIONS.indexOf(userDestName);

    // Sekuens stasiun yang dilalui kereta dari terminal keberangkatan ke terminal akhir
    var stationSequence = [];
    if (isEastbound) {
      for (var i = schOriginIdx; i <= schDestIdx; i++) {
        stationSequence.push(STATIONS[i]);
      }
    } else {
      for (var i = schOriginIdx; i >= schDestIdx; i--) {
        stationSequence.push(STATIONS[i]);
      }
    }

    var totalSegs = stationSequence.length - 1;
    var startMins = parseTimeToMinutes(sch.departureTime);
    var endMins = parseTimeToMinutes(sch.arrivalTime);
    var totalDur = endMins >= startMins ? (endMins - startMins) : (endMins + 1440 - startMins);
    var durPerSeg = totalSegs > 0 ? (totalDur / totalSegs) : 6.5;

    var stops = stationSequence.map(function (stName, index) {
      var detail = getStationDetail(stName) || {
        name: stName,
        code: stName.substring(0, 3).toUpperCase(),
        city: '',
        isTransit: false,
        transitDesc: ''
      };

      var depMins = Math.round(startMins + index * durPerSeg);
      var arrMins = index === 0 ? depMins : Math.round(depMins - 1); // 1 menit waktu transit/singgah
      var depFormatted = formatMinutesToTime(depMins);
      var arrFormatted = formatMinutesToTime(arrMins);

      var isUserOrigin = (stName.toLowerCase() === userOrigName.toLowerCase());
      var isUserDestination = (stName.toLowerCase() === userDestName.toLowerCase());

      var isBetween = false;
      if (userOrigIdx !== -1 && userDestIdx !== -1) {
        var thisIdx = STATIONS.indexOf(stName);
        if (isEastbound) {
          isBetween = (thisIdx >= userOrigIdx && thisIdx <= userDestIdx);
        } else {
          isBetween = (thisIdx <= userOrigIdx && thisIdx >= userDestIdx);
        }
      }

      var role = 'INTERMEDIATE';
      if (index === 0) role = 'TERMINAL_ORIGIN';
      else if (index === stationSequence.length - 1) role = 'TERMINAL_DESTINATION';
      if (isUserOrigin) role = 'USER_ORIGIN';
      if (isUserDestination) role = 'USER_DESTINATION';

      return {
        order: index,
        stationName: detail.name,
        stationCode: detail.code,
        alias: detail.alias || '',
        city: detail.city || '',
        isTransit: !!detail.isTransit,
        transitDesc: detail.transitDesc || (detail.isTransit ? 'Transit' : ''),
        isAirport: !!detail.isAirport,
        arrivalTime: arrFormatted,
        departureTime: depFormatted,
        timeDisplay: depFormatted,
        isUserOrigin: isUserOrigin,
        isUserDestination: isUserDestination,
        isBetweenSelected: isBetween,
        role: role
      };
    });

    var trainCode = sch.trainCode || ('#' + (sch.trainNumber ? sch.trainNumber.replace(/\D/g, '') : ''));

    return {
      scheduleId: sch.id,
      trainNumber: sch.trainNumber,
      trainCode: trainCode,
      displayTrainName: trainCode + ' (' + sch.trainNumber + ')',
      tripId: sch.tripId,
      trainsetId: sch.trainsetId,
      scenario: sch.scenario || 'MEDIUM',
      notes: sch.notes || '',
      lineName: 'Commuter Line Yogyakarta',
      terminalOrigin: sch.originStation,
      terminalDestination: sch.destinationStation,
      departureTime: sch.departureTime,
      arrivalTime: sch.arrivalTime,
      userOrigin: userOrigName,
      userDestination: userDestName,
      totalStops: stops.length,
      stops: stops
    };
  }

  return {
    isSimulation: true,
    STATIONS: STATIONS,
    STATION_DETAILS: STATION_DETAILS,
    searchStations: searchStations,
    getStationDetail: getStationDetail,
    getAvailableDestinations: getAvailableDestinations,
    getTrainRouteDetails: getTrainRouteDetails,
    getAll: getAll,
    getById: getById,
    search: search,
    add: add,
    update: update,
    delete: deleteSchedule,
    resetDefaults: resetDefaults,
    getActiveTrip: getActiveTrip,
    setActiveTrip: setActiveTrip
  };
});
