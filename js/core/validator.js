/**
 * KRL Density MVP - Data Validator Module
 * Dokumen Acuan: PRD MVP Versi 4.1 & Bagian 8 Instruksi QC
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../config/constants'));
  } else {
    root.KRL = root.KRL || {};
    root.KRL.Validator = factory(root.KRL.Constants);
  }
})(typeof self !== 'undefined' ? self : this, function (Constants) {
  'use strict';

  var EXPECTED_CARRIAGES = (Constants && Constants.CARRIAGE_IDS) || ['K1', 'K2', 'K3', 'K4', 'K5', 'K6'];
  var EXPECTED_CAPACITY = (Constants && Constants.CAPACITY_PER_CARRIAGE) || 250;

  /**
   * Memvalidasi satu item gerbong.
   * 
   * @param {Object} item 
   * @returns {{isValid: boolean, error: string|null}}
   */
  function validateCarriageItem(item) {
    if (!item || typeof item !== 'object') {
      return { isValid: false, error: 'Data gerbong bukan objek valid' };
    }

    // Periksa carriage_id
    if (!item.carriage_id || EXPECTED_CARRIAGES.indexOf(item.carriage_id) === -1) {
      return { isValid: false, error: 'ID gerbong tidak valid (harus K1-K6): ' + item.carriage_id };
    }

    // Periksa passenger_count (harus bilangan bulat non-negatif)
    if (typeof item.passenger_count !== 'number' || 
        isNaN(item.passenger_count) || 
        !isFinite(item.passenger_count) || 
        item.passenger_count < 0 || 
        Math.floor(item.passenger_count) !== item.passenger_count) {
      return { isValid: false, error: 'Jumlah penumpang harus bilangan bulat >= 0 pada ' + item.carriage_id };
    }

    // Periksa assumed_capacity (harus 250)
    var cap = (typeof item.assumed_capacity === 'number') ? item.assumed_capacity : item.capacity;
    if (cap !== EXPECTED_CAPACITY) {
      return { isValid: false, error: 'Kapasitas gerbong harus tepat ' + EXPECTED_CAPACITY + ' pada ' + item.carriage_id };
    }

    return { isValid: true, error: null };
  }

  /**
   * Memvalidasi dataset lengkap enam gerbong.
   * 
   * @param {Array<Object>} dataset - Array berisi data 6 gerbong
   * @param {Object} [meta] - Metadata opsional (source_type, dll.)
   * @returns {{isValid: boolean, error: string|null, errors: Array<string>}}
   */
  function validateDataset(dataset, meta) {
    var errors = [];

    // Periksa null/undefined/array
    if (!dataset || !Array.isArray(dataset)) {
      return {
        isValid: false,
        error: 'Dataset tidak tersedia atau bukan array',
        errors: ['Dataset null atau bukan array']
      };
    }

    // Periksa jumlah gerbong (harus tepat 6)
    if (dataset.length !== EXPECTED_CARRIAGES.length) {
      errors.push('Jumlah gerbong tidak lengkap: diharapkan ' + EXPECTED_CARRIAGES.length + ', diterima ' + dataset.length);
    }

    // Periksa metadata sumber jika disediakan
    if (meta && typeof meta === 'object') {
      var source = meta.source_type || meta.source;
      if (!source || String(source).indexOf('SIMULATION') === -1) {
        errors.push('Penanda sumber data wajib SIMULATION');
      }
    }

    // Periksa kelengkapan dan keunikan tiap ID gerbong K1-K6
    var seenCarriages = {};
    for (var i = 0; i < dataset.length; i++) {
      var item = dataset[i];
      var itemValidation = validateCarriageItem(item);
      
      if (!itemValidation.isValid) {
        errors.push(itemValidation.error);
      } else {
        if (seenCarriages[item.carriage_id]) {
          errors.push('Duplikasi ID gerbong terdeteksi: ' + item.carriage_id);
        }
        seenCarriages[item.carriage_id] = true;
      }
    }

    // Pastikan seluruh K1-K6 ada
    for (var j = 0; j < EXPECTED_CARRIAGES.length; j++) {
      var cid = EXPECTED_CARRIAGES[j];
      if (!seenCarriages[cid]) {
        errors.push('Gerbong ' + cid + ' tidak ditemukan dalam dataset');
      }
    }

    return {
      isValid: errors.length === 0,
      error: errors.length > 0 ? errors[0] : null,
      errors: errors
    };
  }

  return {
    validateCarriageItem: validateCarriageItem,
    validateDataset: validateDataset
  };
});
