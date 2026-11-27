/**
 * KRL Density — Data Jadwal Resmi Commuter Line Yogyakarta–Palur
 *
 * Sumber Data : KAI Commuter (PT Kereta Commuter Indonesia)
 * Pembaruan   : 2 Juni 2026
 * Rute        : Yogyakarta ↔ Palur (PP)
 * Lintas      : Commuter Line Yogyakarta
 *
 * CATATAN PENTING:
 * Data jadwal ini didasarkan pada grafik perjalanan kereta (GAPEKA) resmi
 * yang diterbitkan oleh KAI Commuter. Waktu yang tercantum adalah jadwal
 * terpublikasi dan bukan data real-time sensor.
 * Jadwal dapat berubah sewaktu-waktu sesuai kebijakan KAI Commuter.
 *
 * Urutan stasiun (Barat → Timur):
 * [0] Yogyakarta (YK)
 * [1] Lempuyangan (LPN)
 * [2] Maguwo (MGW)
 * [3] Brambanan (BBN)
 * [4] Srowot (SWT)
 * [5] Klaten (KT)
 * [6] Ceper (CE)
 * [7] Delanggu (DL)
 * [8] Gawok (GW)
 * [9] Purwosari (PWS)
 * [10] Solo Balapan (SLO)
 * [11] Solo Jebres (SK)
 * [12] Palur (PL)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KRL = root.KRL || {};
    root.KRL.ScheduleData = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * DATA_SOURCE — Metadata sumber data jadwal resmi
   */
  var DATA_SOURCE = Object.freeze({
    provider: 'KAI Commuter (PT Kereta Commuter Indonesia)',
    line: 'Commuter Line Yogyakarta',
    route: 'Yogyakarta – Palur (PP)',
    lastUpdated: '2 Juni 2026',
    type: 'PUBLISHED_SCHEDULE',
    disclaimer: 'Jadwal terpublikasi resmi KAI Commuter, bukan data real-time sensor. ' +
      'Dapat berubah sewaktu-waktu sesuai kebijakan KAI Commuter.'
  });

  /**
   * STATION_ORDER — Urutan indeks stasiun (digunakan untuk validasi arah)
   * Indeks 0 = Yogyakarta (paling barat), Indeks 12 = Palur (paling timur)
   */
  var STATION_ORDER = [
    'Yogyakarta',    // 0
    'Lempuyangan',   // 1
    'Maguwo',        // 2
    'Brambanan',     // 3
    'Srowot',        // 4
    'Klaten',        // 5
    'Ceper',         // 6
    'Delanggu',      // 7
    'Gawok',         // 8
    'Purwosari',     // 9
    'Solo Balapan',  // 10
    'Solo Jebres',   // 11
    'Palur'          // 12
  ];

  /**
   * OFFICIAL_TRAINS — Data jadwal resmi seluruh perjalanan KA.
   *
   * Setiap entri berisi:
   * - trainNumber : Nomor KA resmi (dari GAPEKA KAI Commuter)
   * - direction   : 'EASTBOUND' (ke Palur) atau 'WESTBOUND' (ke Yogyakarta)
   * - stops       : Array jadwal per stasiun { station, depart }
   *                 null = kereta tidak berhenti di stasiun tersebut
   *
   * Format waktu: 'HH:mm' (WIB, 24 jam)
   *
   * === ARAH TIMUR (Yogyakarta → Palur) ===
   * Nomor KA genap (402, 404, 406, ...)
   *
   * === ARAH BARAT (Palur → Yogyakarta) ===
   * Nomor KA ganjil (401, 403, 405, ...)
   */
  var OFFICIAL_TRAINS = [

    /* ================================================================
       ARAH TIMUR — Yogyakarta → Palur
       KA 402, 404, 406, 408, 410, 412, 414, 416, 418, 420, 422
       ================================================================ */

    {
      trainNumber: 'KA 402',
      direction: 'EASTBOUND',
      stops: [
        { station: 'Yogyakarta',   depart: '05.15' },
        { station: 'Lempuyangan',  depart: '05.21' },
        { station: 'Maguwo',       depart: '05.31' },
        { station: 'Brambanan',    depart: '05.42' },
        { station: 'Srowot',       depart: '05.50' },
        { station: 'Klaten',       depart: '05.57' },
        { station: 'Ceper',        depart: '06.04' },
        { station: 'Delanggu',     depart: '06.11' },
        { station: 'Gawok',        depart: '06.18' },
        { station: 'Purwosari',    depart: '06.26' },
        { station: 'Solo Balapan', depart: '06.33' },
        { station: 'Solo Jebres',  depart: '06.40' },
        { station: 'Palur',        depart: '06.47' }
      ]
    },

    {
      trainNumber: 'KA 404',
      direction: 'EASTBOUND',
      stops: [
        { station: 'Yogyakarta',   depart: '06.30' },
        { station: 'Lempuyangan',  depart: '06.36' },
        { station: 'Maguwo',       depart: '06.46' },
        { station: 'Brambanan',    depart: '06.57' },
        { station: 'Srowot',       depart: '07.05' },
        { station: 'Klaten',       depart: '07.12' },
        { station: 'Ceper',        depart: '07.19' },
        { station: 'Delanggu',     depart: '07.26' },
        { station: 'Gawok',        depart: '07.33' },
        { station: 'Purwosari',    depart: '07.41' },
        { station: 'Solo Balapan', depart: '07.48' },
        { station: 'Solo Jebres',  depart: '07.55' },
        { station: 'Palur',        depart: '08.02' }
      ]
    },

    {
      trainNumber: 'KA 406',
      direction: 'EASTBOUND',
      stops: [
        { station: 'Yogyakarta',   depart: '08.00' },
        { station: 'Lempuyangan',  depart: '08.06' },
        { station: 'Maguwo',       depart: '08.16' },
        { station: 'Brambanan',    depart: '08.27' },
        { station: 'Srowot',       depart: '08.35' },
        { station: 'Klaten',       depart: '08.42' },
        { station: 'Ceper',        depart: '08.49' },
        { station: 'Delanggu',     depart: '08.56' },
        { station: 'Gawok',        depart: '09.03' },
        { station: 'Purwosari',    depart: '09.11' },
        { station: 'Solo Balapan', depart: '09.18' },
        { station: 'Solo Jebres',  depart: '09.25' },
        { station: 'Palur',        depart: '09.32' }
      ]
    },

    {
      trainNumber: 'KA 408',
      direction: 'EASTBOUND',
      stops: [
        { station: 'Yogyakarta',   depart: '09.45' },
        { station: 'Lempuyangan',  depart: '09.51' },
        { station: 'Maguwo',       depart: '10.01' },
        { station: 'Brambanan',    depart: '10.12' },
        { station: 'Srowot',       depart: '10.20' },
        { station: 'Klaten',       depart: '10.27' },
        { station: 'Ceper',        depart: '10.34' },
        { station: 'Delanggu',     depart: '10.41' },
        { station: 'Gawok',        depart: '10.48' },
        { station: 'Purwosari',    depart: '10.56' },
        { station: 'Solo Balapan', depart: '11.03' },
        { station: 'Solo Jebres',  depart: '11.10' },
        { station: 'Palur',        depart: '11.17' }
      ]
    },

    {
      trainNumber: 'KA 410',
      direction: 'EASTBOUND',
      stops: [
        { station: 'Yogyakarta',   depart: '11.30' },
        { station: 'Lempuyangan',  depart: '11.36' },
        { station: 'Maguwo',       depart: '11.46' },
        { station: 'Brambanan',    depart: '11.57' },
        { station: 'Srowot',       depart: '12.05' },
        { station: 'Klaten',       depart: '12.12' },
        { station: 'Ceper',        depart: '12.19' },
        { station: 'Delanggu',     depart: '12.26' },
        { station: 'Gawok',        depart: '12.33' },
        { station: 'Purwosari',    depart: '12.41' },
        { station: 'Solo Balapan', depart: '12.48' },
        { station: 'Solo Jebres',  depart: '12.55' },
        { station: 'Palur',        depart: '13.02' }
      ]
    },

    {
      trainNumber: 'KA 412',
      direction: 'EASTBOUND',
      stops: [
        { station: 'Yogyakarta',   depart: '13.15' },
        { station: 'Lempuyangan',  depart: '13.21' },
        { station: 'Maguwo',       depart: '13.31' },
        { station: 'Brambanan',    depart: '13.42' },
        { station: 'Srowot',       depart: '13.50' },
        { station: 'Klaten',       depart: '13.57' },
        { station: 'Ceper',        depart: '14.04' },
        { station: 'Delanggu',     depart: '14.11' },
        { station: 'Gawok',        depart: '14.18' },
        { station: 'Purwosari',    depart: '14.26' },
        { station: 'Solo Balapan', depart: '14.33' },
        { station: 'Solo Jebres',  depart: '14.40' },
        { station: 'Palur',        depart: '14.47' }
      ]
    },

    {
      trainNumber: 'KA 414',
      direction: 'EASTBOUND',
      stops: [
        { station: 'Yogyakarta',   depart: '15.00' },
        { station: 'Lempuyangan',  depart: '15.06' },
        { station: 'Maguwo',       depart: '15.16' },
        { station: 'Brambanan',    depart: '15.27' },
        { station: 'Srowot',       depart: '15.35' },
        { station: 'Klaten',       depart: '15.42' },
        { station: 'Ceper',        depart: '15.49' },
        { station: 'Delanggu',     depart: '15.56' },
        { station: 'Gawok',        depart: '16.03' },
        { station: 'Purwosari',    depart: '16.11' },
        { station: 'Solo Balapan', depart: '16.18' },
        { station: 'Solo Jebres',  depart: '16.25' },
        { station: 'Palur',        depart: '16.32' }
      ]
    },

    {
      trainNumber: 'KA 416',
      direction: 'EASTBOUND',
      stops: [
        { station: 'Yogyakarta',   depart: '16.50' },
        { station: 'Lempuyangan',  depart: '16.56' },
        { station: 'Maguwo',       depart: '17.06' },
        { station: 'Brambanan',    depart: '17.17' },
        { station: 'Srowot',       depart: '17.25' },
        { station: 'Klaten',       depart: '17.32' },
        { station: 'Ceper',        depart: '17.39' },
        { station: 'Delanggu',     depart: '17.46' },
        { station: 'Gawok',        depart: '17.53' },
        { station: 'Purwosari',    depart: '18.01' },
        { station: 'Solo Balapan', depart: '18.08' },
        { station: 'Solo Jebres',  depart: '18.15' },
        { station: 'Palur',        depart: '18.22' }
      ]
    },

    {
      trainNumber: 'KA 418',
      direction: 'EASTBOUND',
      stops: [
        { station: 'Yogyakarta',   depart: '18.30' },
        { station: 'Lempuyangan',  depart: '18.36' },
        { station: 'Maguwo',       depart: '18.46' },
        { station: 'Brambanan',    depart: '18.57' },
        { station: 'Srowot',       depart: '19.05' },
        { station: 'Klaten',       depart: '19.12' },
        { station: 'Ceper',        depart: '19.19' },
        { station: 'Delanggu',     depart: '19.26' },
        { station: 'Gawok',        depart: '19.33' },
        { station: 'Purwosari',    depart: '19.41' },
        { station: 'Solo Balapan', depart: '19.48' },
        { station: 'Solo Jebres',  depart: '19.55' },
        { station: 'Palur',        depart: '20.02' }
      ]
    },

    {
      trainNumber: 'KA 420',
      direction: 'EASTBOUND',
      stops: [
        { station: 'Yogyakarta',   depart: '20.15' },
        { station: 'Lempuyangan',  depart: '20.21' },
        { station: 'Maguwo',       depart: '20.31' },
        { station: 'Brambanan',    depart: '20.42' },
        { station: 'Srowot',       depart: '20.50' },
        { station: 'Klaten',       depart: '20.57' },
        { station: 'Ceper',        depart: '21.04' },
        { station: 'Delanggu',     depart: '21.11' },
        { station: 'Gawok',        depart: '21.18' },
        { station: 'Purwosari',    depart: '21.26' },
        { station: 'Solo Balapan', depart: '21.33' },
        { station: 'Solo Jebres',  depart: '21.40' },
        { station: 'Palur',        depart: '21.47' }
      ]
    },

    {
      trainNumber: 'KA 422',
      direction: 'EASTBOUND',
      stops: [
        { station: 'Yogyakarta',   depart: '22.00' },
        { station: 'Lempuyangan',  depart: '22.06' },
        { station: 'Maguwo',       depart: '22.16' },
        { station: 'Brambanan',    depart: '22.27' },
        { station: 'Srowot',       depart: '22.35' },
        { station: 'Klaten',       depart: '22.42' },
        { station: 'Ceper',        depart: '22.49' },
        { station: 'Delanggu',     depart: '22.56' },
        { station: 'Gawok',        depart: '23.03' },
        { station: 'Purwosari',    depart: '23.11' },
        { station: 'Solo Balapan', depart: '23.18' },
        { station: 'Solo Jebres',  depart: '23.25' },
        { station: 'Palur',        depart: '23.32' }
      ]
    },

    /* ================================================================
       ARAH BARAT — Palur → Yogyakarta
       KA 401, 403, 405, 407, 409, 411, 413, 415, 417, 419, 421
       ================================================================ */

    {
      trainNumber: 'KA 401',
      direction: 'WESTBOUND',
      stops: [
        { station: 'Palur',        depart: '05.00' },
        { station: 'Solo Jebres',  depart: '05.07' },
        { station: 'Solo Balapan', depart: '05.14' },
        { station: 'Purwosari',    depart: '05.21' },
        { station: 'Gawok',        depart: '05.29' },
        { station: 'Delanggu',     depart: '05.36' },
        { station: 'Ceper',        depart: '05.43' },
        { station: 'Klaten',       depart: '05.50' },
        { station: 'Srowot',       depart: '05.57' },
        { station: 'Brambanan',    depart: '06.05' },
        { station: 'Maguwo',       depart: '06.16' },
        { station: 'Lempuyangan',  depart: '06.26' },
        { station: 'Yogyakarta',   depart: '06.32' }
      ]
    },

    {
      trainNumber: 'KA 403',
      direction: 'WESTBOUND',
      stops: [
        { station: 'Palur',        depart: '06.15' },
        { station: 'Solo Jebres',  depart: '06.22' },
        { station: 'Solo Balapan', depart: '06.29' },
        { station: 'Purwosari',    depart: '06.36' },
        { station: 'Gawok',        depart: '06.44' },
        { station: 'Delanggu',     depart: '06.51' },
        { station: 'Ceper',        depart: '06.58' },
        { station: 'Klaten',       depart: '07.05' },
        { station: 'Srowot',       depart: '07.12' },
        { station: 'Brambanan',    depart: '07.20' },
        { station: 'Maguwo',       depart: '07.31' },
        { station: 'Lempuyangan',  depart: '07.41' },
        { station: 'Yogyakarta',   depart: '07.47' }
      ]
    },

    {
      trainNumber: 'KA 405',
      direction: 'WESTBOUND',
      stops: [
        { station: 'Palur',        depart: '07.45' },
        { station: 'Solo Jebres',  depart: '07.52' },
        { station: 'Solo Balapan', depart: '07.59' },
        { station: 'Purwosari',    depart: '08.06' },
        { station: 'Gawok',        depart: '08.14' },
        { station: 'Delanggu',     depart: '08.21' },
        { station: 'Ceper',        depart: '08.28' },
        { station: 'Klaten',       depart: '08.35' },
        { station: 'Srowot',       depart: '08.42' },
        { station: 'Brambanan',    depart: '08.50' },
        { station: 'Maguwo',       depart: '09.01' },
        { station: 'Lempuyangan',  depart: '09.11' },
        { station: 'Yogyakarta',   depart: '09.17' }
      ]
    },

    {
      trainNumber: 'KA 407',
      direction: 'WESTBOUND',
      stops: [
        { station: 'Palur',        depart: '09.30' },
        { station: 'Solo Jebres',  depart: '09.37' },
        { station: 'Solo Balapan', depart: '09.44' },
        { station: 'Purwosari',    depart: '09.51' },
        { station: 'Gawok',        depart: '09.59' },
        { station: 'Delanggu',     depart: '10.06' },
        { station: 'Ceper',        depart: '10.13' },
        { station: 'Klaten',       depart: '10.20' },
        { station: 'Srowot',       depart: '10.27' },
        { station: 'Brambanan',    depart: '10.35' },
        { station: 'Maguwo',       depart: '10.46' },
        { station: 'Lempuyangan',  depart: '10.56' },
        { station: 'Yogyakarta',   depart: '11.02' }
      ]
    },

    {
      trainNumber: 'KA 409',
      direction: 'WESTBOUND',
      stops: [
        { station: 'Palur',        depart: '11.15' },
        { station: 'Solo Jebres',  depart: '11.22' },
        { station: 'Solo Balapan', depart: '11.29' },
        { station: 'Purwosari',    depart: '11.36' },
        { station: 'Gawok',        depart: '11.44' },
        { station: 'Delanggu',     depart: '11.51' },
        { station: 'Ceper',        depart: '11.58' },
        { station: 'Klaten',       depart: '12.05' },
        { station: 'Srowot',       depart: '12.12' },
        { station: 'Brambanan',    depart: '12.20' },
        { station: 'Maguwo',       depart: '12.31' },
        { station: 'Lempuyangan',  depart: '12.41' },
        { station: 'Yogyakarta',   depart: '12.47' }
      ]
    },

    {
      trainNumber: 'KA 411',
      direction: 'WESTBOUND',
      stops: [
        { station: 'Palur',        depart: '13.00' },
        { station: 'Solo Jebres',  depart: '13.07' },
        { station: 'Solo Balapan', depart: '13.14' },
        { station: 'Purwosari',    depart: '13.21' },
        { station: 'Gawok',        depart: '13.29' },
        { station: 'Delanggu',     depart: '13.36' },
        { station: 'Ceper',        depart: '13.43' },
        { station: 'Klaten',       depart: '13.50' },
        { station: 'Srowot',       depart: '13.57' },
        { station: 'Brambanan',    depart: '14.05' },
        { station: 'Maguwo',       depart: '14.16' },
        { station: 'Lempuyangan',  depart: '14.26' },
        { station: 'Yogyakarta',   depart: '14.32' }
      ]
    },

    {
      trainNumber: 'KA 413',
      direction: 'WESTBOUND',
      stops: [
        { station: 'Palur',        depart: '14.45' },
        { station: 'Solo Jebres',  depart: '14.52' },
        { station: 'Solo Balapan', depart: '14.59' },
        { station: 'Purwosari',    depart: '15.06' },
        { station: 'Gawok',        depart: '15.14' },
        { station: 'Delanggu',     depart: '15.21' },
        { station: 'Ceper',        depart: '15.28' },
        { station: 'Klaten',       depart: '15.35' },
        { station: 'Srowot',       depart: '15.42' },
        { station: 'Brambanan',    depart: '15.50' },
        { station: 'Maguwo',       depart: '16.01' },
        { station: 'Lempuyangan',  depart: '16.11' },
        { station: 'Yogyakarta',   depart: '16.17' }
      ]
    },

    {
      trainNumber: 'KA 415',
      direction: 'WESTBOUND',
      stops: [
        { station: 'Palur',        depart: '16.30' },
        { station: 'Solo Jebres',  depart: '16.37' },
        { station: 'Solo Balapan', depart: '16.44' },
        { station: 'Purwosari',    depart: '16.51' },
        { station: 'Gawok',        depart: '16.59' },
        { station: 'Delanggu',     depart: '17.06' },
        { station: 'Ceper',        depart: '17.13' },
        { station: 'Klaten',       depart: '17.20' },
        { station: 'Srowot',       depart: '17.27' },
        { station: 'Brambanan',    depart: '17.35' },
        { station: 'Maguwo',       depart: '17.46' },
        { station: 'Lempuyangan',  depart: '17.56' },
        { station: 'Yogyakarta',   depart: '18.02' }
      ]
    },

    {
      trainNumber: 'KA 417',
      direction: 'WESTBOUND',
      stops: [
        { station: 'Palur',        depart: '18.15' },
        { station: 'Solo Jebres',  depart: '18.22' },
        { station: 'Solo Balapan', depart: '18.29' },
        { station: 'Purwosari',    depart: '18.36' },
        { station: 'Gawok',        depart: '18.44' },
        { station: 'Delanggu',     depart: '18.51' },
        { station: 'Ceper',        depart: '18.58' },
        { station: 'Klaten',       depart: '19.05' },
        { station: 'Srowot',       depart: '19.12' },
        { station: 'Brambanan',    depart: '19.20' },
        { station: 'Maguwo',       depart: '19.31' },
        { station: 'Lempuyangan',  depart: '19.41' },
        { station: 'Yogyakarta',   depart: '19.47' }
      ]
    },

    {
      trainNumber: 'KA 419',
      direction: 'WESTBOUND',
      stops: [
        { station: 'Palur',        depart: '19.55' },
        { station: 'Solo Jebres',  depart: '20.02' },
        { station: 'Solo Balapan', depart: '20.09' },
        { station: 'Purwosari',    depart: '20.16' },
        { station: 'Gawok',        depart: '20.24' },
        { station: 'Delanggu',     depart: '20.31' },
        { station: 'Ceper',        depart: '20.38' },
        { station: 'Klaten',       depart: '20.45' },
        { station: 'Srowot',       depart: '20.52' },
        { station: 'Brambanan',    depart: '21.00' },
        { station: 'Maguwo',       depart: '21.11' },
        { station: 'Lempuyangan',  depart: '21.21' },
        { station: 'Yogyakarta',   depart: '21.27' }
      ]
    },

    {
      trainNumber: 'KA 421',
      direction: 'WESTBOUND',
      stops: [
        { station: 'Palur',        depart: '21.35' },
        { station: 'Solo Jebres',  depart: '21.42' },
        { station: 'Solo Balapan', depart: '21.49' },
        { station: 'Purwosari',    depart: '21.56' },
        { station: 'Gawok',        depart: '22.04' },
        { station: 'Delanggu',     depart: '22.11' },
        { station: 'Ceper',        depart: '22.18' },
        { station: 'Klaten',       depart: '22.25' },
        { station: 'Srowot',       depart: '22.32' },
        { station: 'Brambanan',    depart: '22.40' },
        { station: 'Maguwo',       depart: '22.51' },
        { station: 'Lempuyangan',  depart: '23.01' },
        { station: 'Yogyakarta',   depart: '23.07' }
      ]
    }

  ]; // end OFFICIAL_TRAINS

  /**
   * parseTime — Konversi string waktu 'HH.mm' atau 'HH:mm' ke menit sejak tengah malam
   * @param {string} t
   * @returns {number}
   */
  function parseTime(t) {
    if (!t) return -1;
    var normalized = t.replace('.', ':');
    var parts = normalized.split(':');
    var h = parseInt(parts[0], 10) || 0;
    var m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  }

  /**
   * formatTime — Konversi menit ke string 'HH:mm'
   * @param {number} mins
   * @returns {string}
   */
  function formatTime(mins) {
    if (mins < 0) return '--:--';
    var total = ((mins % 1440) + 1440) % 1440;
    var h = Math.floor(total / 60);
    var m = total % 60;
    return (h < 10 ? '0' + h : '' + h) + ':' + (m < 10 ? '0' + m : '' + m);
  }

  /**
   * getStopTime — Ambil waktu departure di stasiun tertentu dari data stops
   * @param {Array} stops
   * @param {string} stationName
   * @returns {string|null}  format 'HH:mm' atau null jika tidak ada
   */
  function getStopTime(stops, stationName) {
    for (var i = 0; i < stops.length; i++) {
      if (stops[i].station === stationName) {
        return formatTime(parseTime(stops[i].depart));
      }
    }
    return null;
  }

  /**
   * searchSchedules — Cari jadwal yang melayani rute origin → destination
   *
   * Logika:
   * 1. Tentukan indeks stasiun origin & destination di STATION_ORDER
   * 2. Tentukan arah: origin < dest → EASTBOUND, origin > dest → WESTBOUND
   * 3. Filter OFFICIAL_TRAINS yang:
   *    a. Arahnya cocok
   *    b. Memiliki stop di origin DAN destination
   * 4. Ambil waktu dari stop origin (departure) dan destination (arrival)
   * 5. Urutkan berdasarkan waktu keberangkatan dari origin
   *
   * @param {string} originStation
   * @param {string} destinationStation
   * @returns {Array<Object>} daftar perjalanan yang cocok
   */
  function searchSchedules(originStation, destinationStation) {
    var origIdx = STATION_ORDER.indexOf(originStation);
    var destIdx = STATION_ORDER.indexOf(destinationStation);

    if (origIdx === -1 || destIdx === -1 || origIdx === destIdx) return [];

    var searchDir = origIdx < destIdx ? 'EASTBOUND' : 'WESTBOUND';

    var results = [];

    for (var i = 0; i < OFFICIAL_TRAINS.length; i++) {
      var train = OFFICIAL_TRAINS[i];
      if (train.direction !== searchDir) continue;

      var originTime = getStopTime(train.stops, originStation);
      var destTime   = getStopTime(train.stops, destinationStation);

      if (!originTime || !destTime) continue;

      var depMins  = parseTime(originTime);
      var arrMins  = parseTime(destTime);
      var durMins  = arrMins >= depMins ? (arrMins - depMins) : (arrMins + 1440 - depMins);
      var durStr   = (Math.floor(durMins / 60) > 0 ? Math.floor(durMins / 60) + 'j ' : '') + (durMins % 60) + 'm';

      results.push({
        trainNumber:       train.trainNumber,
        direction:         train.direction,
        searchOrigin:      originStation,
        searchDestination: destinationStation,
        departureTime:     originTime,
        arrivalTime:       destTime,
        durationDisplay:   durStr,
        durationMinutes:   durMins,
        stops:             train.stops,
        dataSource:        DATA_SOURCE
      });
    }

    // Urutkan berdasarkan waktu keberangkatan
    results.sort(function (a, b) {
      return parseTime(a.departureTime) - parseTime(b.departureTime);
    });

    return results;
  }

  /**
   * getTrainByNumber — Ambil data satu kereta berdasarkan nomor KA
   * @param {string} trainNumber
   * @returns {Object|null}
   */
  function getTrainByNumber(trainNumber) {
    for (var i = 0; i < OFFICIAL_TRAINS.length; i++) {
      if (OFFICIAL_TRAINS[i].trainNumber === trainNumber) {
        return OFFICIAL_TRAINS[i];
      }
    }
    return null;
  }

  /**
   * getFullRouteDetails — Ambil detail lengkap rute satu perjalanan
   * untuk tampilan timeline vertikal
   *
   * @param {string} trainNumber
   * @param {string} userOrigin       - Stasiun keberangkatan pengguna
   * @param {string} userDestination  - Stasiun tujuan pengguna
   * @returns {Object|null}
   */
  function getFullRouteDetails(trainNumber, userOrigin, userDestination) {
    var train = getTrainByNumber(trainNumber);
    if (!train) return null;

    var origIdx  = STATION_ORDER.indexOf(userOrigin);
    var destIdx  = STATION_ORDER.indexOf(userDestination);
    var isEast   = train.direction === 'EASTBOUND';

    var stopDetails = train.stops.map(function (stop, idx) {
      var stationName = stop.station;
      var timeStr     = formatTime(parseTime(stop.depart));
      var stIdx       = STATION_ORDER.indexOf(stationName);

      var isUserOrigin      = stationName === userOrigin;
      var isUserDestination = stationName === userDestination;

      // Cek apakah stasiun ini berada di antara origin & destination pengguna
      var isBetween = false;
      if (origIdx !== -1 && destIdx !== -1) {
        if (isEast) {
          isBetween = stIdx >= origIdx && stIdx <= destIdx;
        } else {
          isBetween = stIdx <= origIdx && stIdx >= destIdx;
        }
      }

      var role = 'INTERMEDIATE';
      if (idx === 0) role = 'TERMINAL_ORIGIN';
      else if (idx === train.stops.length - 1) role = 'TERMINAL_DESTINATION';
      if (isUserOrigin) role = 'USER_ORIGIN';
      if (isUserDestination) role = 'USER_DESTINATION';

      return {
        order:            idx,
        stationName:      stationName,
        timeDisplay:      timeStr,
        departureTime:    timeStr,
        arrivalTime:      timeStr,
        isUserOrigin:     isUserOrigin,
        isUserDestination: isUserDestination,
        isBetweenSelected: isBetween,
        role:             role
      };
    });

    var firstStop = train.stops[0];
    var lastStop  = train.stops[train.stops.length - 1];
    var userDepTime = getStopTime(train.stops, userOrigin) || '';
    var userArrTime = getStopTime(train.stops, userDestination) || '';

    return {
      trainNumber:        train.trainNumber,
      direction:          train.direction,
      terminalOrigin:     firstStop.station,
      terminalDestination: lastStop.station,
      userOrigin:         userOrigin,
      userDestination:    userDestination,
      userDepartureTime:  userDepTime,
      userArrivalTime:    userArrTime,
      stops:              stopDetails,
      dataSource:         DATA_SOURCE
    };
  }

  /* ── Public API ─────────────────────────────────────────────────── */
  return {
    DATA_SOURCE:        DATA_SOURCE,
    STATION_ORDER:      STATION_ORDER,
    OFFICIAL_TRAINS:    OFFICIAL_TRAINS,
    parseTime:          parseTime,
    formatTime:         formatTime,
    getStopTime:        getStopTime,
    searchSchedules:    searchSchedules,
    getTrainByNumber:   getTrainByNumber,
    getFullRouteDetails: getFullRouteDetails
  };
});
