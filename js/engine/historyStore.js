/**
 * KRL Density MVP - History Management Module (LocalStorage)
 * Dokumen Acuan: PRD MVP Versi 4.1 Bab 9.3 & Instruksi QC Tahap 3
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../config/constants'));
  } else {
    root.KRL = root.KRL || {};
    root.KRL.HistoryStore = factory(root.KRL.Constants);
  }
})(typeof self !== 'undefined' ? self : this, function (Constants) {
  'use strict';

  var STORAGE_KEYS = (Constants && Constants.STORAGE_KEYS) || {
    SNAPSHOTS: 'krl_density_snapshots',
    SCENARIO_SUMMARIES: 'krl_density_scenario_summaries',
    CYCLE_SUMMARIES: 'krl_density_cycle_summaries',
    TRANSITION_LOGS: 'krl_density_transition_logs'
  };

  var MAX_CYCLES = (Constants && Constants.MAX_HISTORY_CYCLES) || 10;
  var lastError = null;

  /**
   * Helper membaca JSON dari LocalStorage dengan aman.
   */
  function safeGet(key, defaultValue) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultValue;
      }
      var item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      lastError = 'Gagal membaca LocalStorage (' + key + '): ' + e.message;
      return defaultValue;
    }
  }

  /**
   * Helper menulis JSON ke LocalStorage dengan aman & penanganan error kuota.
   */
  function safeSet(key, value) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.setItem(key, JSON.stringify(value));
      lastError = null;
      return true;
    } catch (e) {
      lastError = 'Gagal menyimpan ke LocalStorage (' + key + '): ' + e.message;
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(lastError);
      }
      return false;
    }
  }

  /**
   * Memangkas riwayat agar maksimal hanya menyimpan 10 siklus terakhir.
   * Tidak menghapus data untuk siklus yang sedang aktif.
   * 
   * @param {number} activeCycleNumber 
   */
  function pruneOldCycles(activeCycleNumber) {
    if (typeof activeCycleNumber !== 'number' || activeCycleNumber <= MAX_CYCLES) {
      return;
    }

    var minCycleToKeep = Math.max(1, activeCycleNumber - MAX_CYCLES + 1);

    // Prune snapshots
    var snapshots = safeGet(STORAGE_KEYS.SNAPSHOTS, []);
    var filteredSnapshots = snapshots.filter(function (s) {
      return s.cycle_number >= minCycleToKeep;
    });
    if (filteredSnapshots.length !== snapshots.length) {
      safeSet(STORAGE_KEYS.SNAPSHOTS, filteredSnapshots);
    }

    // Prune scenario summaries
    var scenarios = safeGet(STORAGE_KEYS.SCENARIO_SUMMARIES, []);
    var filteredScenarios = scenarios.filter(function (s) {
      return s.cycle_number >= minCycleToKeep;
    });
    if (filteredScenarios.length !== scenarios.length) {
      safeSet(STORAGE_KEYS.SCENARIO_SUMMARIES, filteredScenarios);
    }

    // Prune cycle summaries
    var cycles = safeGet(STORAGE_KEYS.CYCLE_SUMMARIES, []);
    var filteredCycles = cycles.filter(function (c) {
      return c.cycle_number >= minCycleToKeep;
    });
    if (filteredCycles.length !== cycles.length) {
      safeSet(STORAGE_KEYS.CYCLE_SUMMARIES, filteredCycles);
    }
  }

  /**
   * Menyimpan satu paket snapshot 10 detik berisi 6 gerbong.
   * Sesuai Lampiran A PRD v4.1.
   * 
   * @param {Object} snapshotPackage - Paket snapshot berisi metadata dan 6 gerbong
   * @returns {boolean} Status keberhasilan
   */
  function saveSnapshot(snapshotPackage) {
    if (!snapshotPackage || !snapshotPackage.cycle_number) {
      lastError = 'Data snapshot tidak valid untuk disimpan';
      return false;
    }

    var snapshots = safeGet(STORAGE_KEYS.SNAPSHOTS, []);
    snapshots.push(snapshotPackage);
    var success = safeSet(STORAGE_KEYS.SNAPSHOTS, snapshots);

    // Auto-prune
    pruneOldCycles(snapshotPackage.cycle_number);
    return success;
  }

  /**
   * Mengambil seluruh snapshot yang tersimpan.
   * @returns {Array<Object>}
   */
  function getSnapshots() {
    return safeGet(STORAGE_KEYS.SNAPSHOTS, []);
  }

  /**
   * Menyimpan ringkasan skenario setelah skenario selesai (180 detik).
   * 
   * @param {Object} summary - Ringkasan skenario
   * @returns {boolean}
   */
  function saveScenarioSummary(summary) {
    if (!summary || !summary.scenario_id) {
      return false;
    }
    var summaries = safeGet(STORAGE_KEYS.SCENARIO_SUMMARIES, []);
    summaries.push(summary);
    var success = safeSet(STORAGE_KEYS.SCENARIO_SUMMARIES, summaries);
    if (summary.cycle_number) {
      pruneOldCycles(summary.cycle_number);
    }
    return success;
  }

  /**
   * Mengambil seluruh ringkasan skenario.
   * @returns {Array<Object>}
   */
  function getScenarioSummaries() {
    return safeGet(STORAGE_KEYS.SCENARIO_SUMMARIES, []);
  }

  /**
   * Menyimpan ringkasan siklus (setelah 1 siklus selesai atau dihentikan).
   * 
   * @param {Object} summary - Ringkasan siklus
   * @returns {boolean}
   */
  function saveCycleSummary(summary) {
    if (!summary || typeof summary.cycle_number !== 'number') {
      return false;
    }
    var summaries = safeGet(STORAGE_KEYS.CYCLE_SUMMARIES, []);
    summaries.push(summary);
    var success = safeSet(STORAGE_KEYS.CYCLE_SUMMARIES, summaries);
    pruneOldCycles(summary.cycle_number);
    return success;
  }

  /**
   * Mengambil seluruh ringkasan siklus.
   * @returns {Array<Object>}
   */
  function getCycleSummaries() {
    return safeGet(STORAGE_KEYS.CYCLE_SUMMARIES, []);
  }

  /**
   * Mencatat log peristiwa pergantian skenario / simulasi.
   * 
   * @param {Object} logEntry 
   */
  function logTransition(logEntry) {
    var logs = safeGet(STORAGE_KEYS.TRANSITION_LOGS, []);
    logs.push(logEntry);
    safeSet(STORAGE_KEYS.TRANSITION_LOGS, logs);
  }

  /**
   * Mengambil daftar log pergantian skenario.
   * @returns {Array<Object>}
   */
  function getTransitionLogs() {
    return safeGet(STORAGE_KEYS.TRANSITION_LOGS, []);
  }

  /**
   * Membersihkan seluruh data riwayat simulasi lokal di browser.
   * Tidak menghapus preset, kapasitas, atau konfigurasi aplikasi.
   * 
   * @returns {boolean}
   */
  function resetHistory() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEYS.SNAPSHOTS);
        window.localStorage.removeItem(STORAGE_KEYS.SCENARIO_SUMMARIES);
        window.localStorage.removeItem(STORAGE_KEYS.CYCLE_SUMMARIES);
        window.localStorage.removeItem(STORAGE_KEYS.TRANSITION_LOGS);
      }
      lastError = null;
      return true;
    } catch (e) {
      lastError = 'Gagal mereset riwayat: ' + e.message;
      return false;
    }
  }

  /**
   * Mengambil pesan kesalahan terakhir dari LocalStorage.
   * @returns {string|null}
   */
  function getLastError() {
    return lastError;
  }

  return {
    saveSnapshot: saveSnapshot,
    getSnapshots: getSnapshots,
    saveScenarioSummary: saveScenarioSummary,
    getScenarioSummaries: getScenarioSummaries,
    saveCycleSummary: saveCycleSummary,
    getCycleSummaries: getCycleSummaries,
    logTransition: logTransition,
    getTransitionLogs: getTransitionLogs,
    resetHistory: resetHistory,
    pruneOldCycles: pruneOldCycles,
    getLastError: getLastError
  };
});
