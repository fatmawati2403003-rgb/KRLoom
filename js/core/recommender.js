/**
 * KRL Density MVP - Recommender Module
 * Dokumen Acuan: PRD MVP Versi 4.1 Bab 7.3 & Bagian 7 Instruksi QC
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../config/constants'),
      require('./calculator'),
      require('./validator')
    );
  } else {
    root.KRL = root.KRL || {};
    root.KRL.Recommender = factory(
      root.KRL.Constants,
      root.KRL.Calculator,
      root.KRL.Validator
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Constants, Calculator, Validator) {
  'use strict';

  var CARRIAGE_ORDER = (Constants && Constants.CARRIAGE_IDS) || ['K1', 'K2', 'K3', 'K4', 'K5', 'K6'];
  var HIGH_THRESHOLD = (Constants && Constants.THRESHOLDS && Constants.THRESHOLDS.HIGH_MIN) || 80.0;

  /**
   * Mengurutkan dan menghasilkan rekomendasi kepadatan gerbong.
   * 
   * @param {Array<Object>} carriagesData - Array 6 gerbong { carriage_id, passenger_count, assumed_capacity, ... }
   * @param {Object} [meta] - Metadata perjalanan { trainset_id, trip_id, source_type }
   * @returns {Object} Hasil evaluasi rekomendasi dan peringatan
   */
  function generateRecommendations(carriagesData, meta) {
    // 1. Validasi dataset terlebih dahulu
    var validation = Validator.validateDataset(carriagesData, meta);
    if (!validation.isValid) {
      return {
        isAvailable: false,
        statusText: (Constants && Constants.MESSAGES && Constants.MESSAGES.DATA_UNAVAILABLE) || 'Data Tidak Tersedia',
        errorDetails: validation.errors,
        rankedCarriages: [],
        mostRecommended: null,
        hasOverCapacity: false,
        overCapacityCarriages: [],
        allHighDensity: false,
        warningBanner: null
      };
    }

    // 2. Hitung persentase dan kategori untuk setiap gerbong
    var processed = carriagesData.map(function (item) {
      var cap = item.assumed_capacity || (Constants && Constants.CAPACITY_PER_CARRIAGE) || 250;
      var percent = Calculator.calculateOccupancy(item.passenger_count, cap);
      var categoryInfo = Calculator.classifyDensity(percent);

      return {
        carriage_id: item.carriage_id,
        passenger_count: item.passenger_count,
        assumed_capacity: cap,
        occupancy_percent: percent,
        formatted_percent: Calculator.formatPercentDisplay(percent),
        category_id: categoryInfo.categoryId,
        category_label: categoryInfo.label,
        category_color: categoryInfo.colorName,
        category_hex: categoryInfo.colorHex,
        css_class: categoryInfo.cssClass,
        is_over_capacity: categoryInfo.isOverCapacity,
        is_most_recommended: false,
        recommendation_rank: null
      };
    });

    // 3. Urutkan berdasarkan persentase menaik (ascending)
    // Tie-break: jika persentase sama persis, urutkan berdasarkan urutan nomor gerbong K1-K6
    processed.sort(function (a, b) {
      if (a.occupancy_percent !== b.occupancy_percent) {
        return a.occupancy_percent - b.occupancy_percent;
      }
      var indexA = CARRIAGE_ORDER.indexOf(a.carriage_id);
      var indexB = CARRIAGE_ORDER.indexOf(b.carriage_id);
      return indexA - indexB;
    });

    // 4. Tetapkan peringkat (1 s.d. 6) dan label rekomendasi
    for (var i = 0; i < processed.length; i++) {
      processed[i].recommendation_rank = i + 1;
      if (i === 0) {
        processed[i].is_most_recommended = true;
      }
    }

    // 5. Evaluasi kondisi khusus dan peringatan
    var overCapacityList = [];
    var allHigh = true;

    for (var j = 0; j < processed.length; j++) {
      var carriage = processed[j];
      if (carriage.is_over_capacity) {
        overCapacityList.push(carriage.carriage_id);
      }
      if (carriage.occupancy_percent <= HIGH_THRESHOLD) {
        allHigh = false;
      }
    }

    var warningBanner = null;
    if (allHigh) {
      // Seluruh gerbong berkategori Tinggi (>80%)
      // PERHATIAN: Tidak boleh menyebut kondisi "aman"
      warningBanner = {
        type: 'ALL_HIGH',
        message: (Constants && Constants.MESSAGES && Constants.MESSAGES.ALL_HIGH_WARNING) || 'Semua gerbong berkepadatan tinggi',
        description: 'Tingkat kepadatan seluruh gerbong berada di atas ambang tinggi (>80,0%). Gerbong berperingkat pertama adalah yang relatif terendah di antara rangkaian saat ini.'
      };
    } else if (overCapacityList.length > 0) {
      warningBanner = {
        type: 'OVER_CAPACITY',
        message: 'Peringatan: Gerbong ' + overCapacityList.join(', ') + ' melebihi kapasitas asumsi (>100%).',
        description: 'Harap perhatikan keselamatan dan hindari memaksakan masuk ke gerbong yang telah melebihi kapasitas.'
      };
    }

    return {
      isAvailable: true,
      statusText: 'Data Tersedia',
      errorDetails: [],
      rankedCarriages: processed,
      mostRecommended: processed[0],
      hasOverCapacity: overCapacityList.length > 0,
      overCapacityCarriages: overCapacityList,
      allHighDensity: allHigh,
      warningBanner: warningBanner
    };
  }

  return {
    generateRecommendations: generateRecommendations
  };
});
