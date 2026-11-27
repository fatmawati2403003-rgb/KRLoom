/**
 * KRL Density MVP - Preset Skenario & Variasi Deterministik
 * Dokumen Acuan: PRD MVP Versi 4.1 Bab 8.3 & Instruksi QC Tahap 3
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KRL = root.KRL || {};
    root.KRL.Presets = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Matriks variasi deterministik 18 tick (0 s.d. 17) untuk variasi ±1–3 penumpang
  // Menjamin angka identik pada nomor siklus dan tick yang sama, serta kategori tidak menyimpang.
  var DETERMINISTIC_OFFSETS = Object.freeze({
    K1: Object.freeze([0, 1, 2, 1, 0, -1, -2, -1, 0, 1, 2, 1, 0, -1, -2, -1, 1, 0]),
    K2: Object.freeze([0, -1, -2, -1, 0, 1, 2, 1, 0, -1, -2, -1, 0, 1, 2, 1, -1, 0]),
    K3: Object.freeze([0, 1, 0, -1, -2, -1, 0, 1, 2, 1, 0, -1, -2, -1, 0, 1, 1, 0]),
    K4: Object.freeze([0, -2, -1, 0, 1, 2, 1, 0, -1, -2, -1, 0, 1, 2, 1, 0, -1, 0]),
    K5: Object.freeze([0, 1, 2, 1, 0, -1, -2, -1, 0, 1, 2, 1, 0, -1, -2, -1, 1, 0]),
    K6: Object.freeze([0, -1, 0, 1, 2, 1, 0, -1, -2, -1, 0, 1, 2, 1, 0, -1, -1, 0])
  });

  var SCENARIO_PRESETS = Object.freeze({
    LOW: Object.freeze({
      id: 'LOW',
      name: 'Rendah',
      targetRange: '22.0% - 44.8%',
      passengers: Object.freeze({
        K1: 88,
        K2: 70,
        K3: 105,
        K4: 55,
        K5: 78,
        K6: 112
      })
    }),
    MEDIUM: Object.freeze({
      id: 'MEDIUM',
      name: 'Sedang',
      targetRange: '54.0% - 75.2%',
      passengers: Object.freeze({
        K1: 155,
        K2: 188,
        K3: 145,
        K4: 170,
        K5: 135,
        K6: 178
      })
    }),
    HIGH: Object.freeze({
      id: 'HIGH',
      name: 'Tinggi',
      targetRange: '84.0% - 104.8%',
      passengers: Object.freeze({
        K1: 230,
        K2: 220,
        K3: 262,
        K4: 243,
        K5: 210,
        K6: 253
      })
    })
  });

  /**
   * Menghasilkan jumlah penumpang deterministik berdasarkan skenario dan indeks tick (0..17).
   * 
   * @param {string} scenarioId - 'LOW', 'MEDIUM', atau 'HIGH'
   * @param {number} tickIndex - Indeks tick dalam skenario (0..17)
   * @returns {Object} Pasangan key carriage_id dan jumlah penumpang integer
   */
  function getDeterministicPassengers(scenarioId, tickIndex) {
    var preset = SCENARIO_PRESETS[scenarioId] || SCENARIO_PRESETS.LOW;
    var tick = (typeof tickIndex === 'number' && tickIndex >= 0) ? (tickIndex % 18) : 0;
    var base = preset.passengers;
    var result = {};

    var carriages = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6'];
    for (var i = 0; i < carriages.length; i++) {
      var cid = carriages[i];
      var offset = (DETERMINISTIC_OFFSETS[cid] && DETERMINISTIC_OFFSETS[cid][tick]) || 0;
      result[cid] = base[cid] + offset;
    }

    return result;
  }

  return Object.freeze({
    LOW: SCENARIO_PRESETS.LOW,
    MEDIUM: SCENARIO_PRESETS.MEDIUM,
    HIGH: SCENARIO_PRESETS.HIGH,
    DETERMINISTIC_OFFSETS: DETERMINISTIC_OFFSETS,
    getDeterministicPassengers: getDeterministicPassengers
  });
});
