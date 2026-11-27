/**
 * KRL Density MVP - Simulation Engine Module
 * Dokumen Acuan: PRD MVP Versi 4.1 Bab 5, 8, 9 & Instruksi QC Tahap 3
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../config/constants'),
      require('../config/presets'),
      require('../core/calculator'),
      require('../core/recommender'),
      require('./historyStore')
    );
  } else {
    root.KRL = root.KRL || {};
    root.KRL.SimulationEngine = factory(
      root.KRL.Constants,
      root.KRL.Presets,
      root.KRL.Calculator,
      root.KRL.Recommender,
      root.KRL.HistoryStore
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Constants, Presets, Calculator, Recommender, HistoryStore) {
  'use strict';

  var SCENARIO_DURATION_SEC = (Constants && Constants.SCENARIO_DURATION_SEC) || 180;
  var UPDATE_INTERVAL_SEC = (Constants && Constants.UPDATE_INTERVAL_SEC) || 10;
  var CAPACITY = (Constants && Constants.CAPACITY_PER_CARRIAGE) || 250;
  var SCENARIO_ORDER = (Constants && Constants.SCENARIO_ORDER) || ['LOW', 'MEDIUM', 'HIGH'];

  /**
   * Konstruktor Engine Simulasi.
   * Mendukung injeksi custom time provider untuk pengujian cepat (Fake Clock).
   * 
   * @param {Object} [options]
   * @param {Function} [options.timeProvider] - Fungsi penyedia waktu sekarang (default: Date.now)
   * @param {Function} [options.onTick] - Callback setiap update data 10 detik
   * @param {Function} [options.onStatusChange] - Callback setiap status simulasi berubah
   * @param {Function} [options.onScenarioTransition] - Callback setiap transisi skenario
   */
  function SimulationEngine(options) {
    options = options || {};
    this.timeProvider = options.timeProvider || function () { return Date.now(); };
    this.onTick = options.onTick || null;
    this.onStatusChange = options.onStatusChange || null;
    this.onScenarioTransition = options.onScenarioTransition || null;

    // State Mesin
    this.status = 'STOPPED'; // 'STOPPED' | 'RUNNING' | 'STOPPING_AFTER_SCENARIO'
    this.currentScenario = 'LOW';
    this.currentCycle = 1;
    this.completedCycles = 0;
    this.startTime = null;
    this.scenarioStartTime = 0;
    this.lastTickIndex = -1;
    this.remainingSeconds = SCENARIO_DURATION_SEC;
    this.stopRequested = false;
    this.timerHandle = null;

    // Buffer sementara untuk statistik skenario aktif
    this.activeScenarioSnapshots = [];
  }

  /**
   * Format detik menjadi string mm:ss (contoh: 180 -> "03:00")
   */
  SimulationEngine.prototype.formatCountdown = function (seconds) {
    var s = Math.max(0, Math.floor(seconds));
    var mins = Math.floor(s / 60);
    var secs = s % 60;
    var mm = (mins < 10 ? '0' : '') + mins;
    var ss = (secs < 10 ? '0' : '') + secs;
    return mm + ':' + ss;
  };

  /**
   * Memulai simulasi dari awal skenario Rendah.
   */
  SimulationEngine.prototype.startSimulation = function () {
    if (this.status !== 'STOPPED') {
      return false;
    }

    var now = this.timeProvider();
    this.status = 'RUNNING';
    this.stopRequested = false;
    this.currentScenario = 'LOW';
    this.startTime = new Date(now).toISOString();
    this.scenarioStartTime = now;
    this.lastTickIndex = -1;
    this.remainingSeconds = SCENARIO_DURATION_SEC;
    this.activeScenarioSnapshots = [];

    // Catat log transisi start
    HistoryStore.logTransition({
      timestamp: new Date(now).toISOString(),
      event: 'SIMULATION_STARTED',
      from_scenario: null,
      to_scenario: 'LOW',
      cycle: this.currentCycle,
      status: this.status
    });

    if (this.onStatusChange) {
      this.onStatusChange(this.getState());
    }

    // Jalankan tick awal segera
    this.step();

    // Jalankan timer jika berjalan di lingkungan browser nyata
    var self = this;
    if (typeof window !== 'undefined' && !this.timerHandle) {
      this.timerHandle = setInterval(function () {
        self.step();
      }, 500); // Polling 500ms untuk presisi countdown
    }

    return true;
  };

  /**
   * Menangani satu langkah evaluasi waktu timer (Step Logic).
   */
  SimulationEngine.prototype.step = function () {
    if (this.status === 'STOPPED') {
      return;
    }

    var now = this.timeProvider();
    var elapsedMs = now - this.scenarioStartTime;
    var elapsedSec = elapsedMs / 1000;
    var remaining = Math.max(0, Math.ceil(SCENARIO_DURATION_SEC - elapsedSec));
    this.remainingSeconds = remaining;

    // Hitung tick index saat ini (0 s.d. 17)
    var tickIndex = Math.min(17, Math.floor(elapsedSec / UPDATE_INTERVAL_SEC));

    // Jika terjadi perpindahan tick atau tick awal
    if (tickIndex !== this.lastTickIndex) {
      this.lastTickIndex = tickIndex;
      this.executeTick(tickIndex, now);
    }

    // Periksa apakah durasi 180 detik skenario telah habis
    if (remaining <= 0) {
      this.handleScenarioCompletion(now);
    }
  };

  /**
   * Eksekusi update data pada tick tertentu (setiap 10 detik).
   */
  SimulationEngine.prototype.executeTick = function (tickIndex, timestampMs) {
    var passMap = Presets.getDeterministicPassengers(this.currentScenario, tickIndex);
    var carriages = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6'];

    var dataset = carriages.map(function (cid) {
      return {
        carriage_id: cid,
        passenger_count: passMap[cid],
        assumed_capacity: CAPACITY,
        source_type: 'SIMULATION'
      };
    });

    var meta = {
      trainset_id: (Constants && Constants.TRAINSET_ID) || 'SIM-TS-01',
      trip_id: (Constants && Constants.TRIP_ID) || 'SIM-TRIP-001',
      source_type: 'SIMULATION'
    };

    var recommendation = Recommender.generateRecommendations(dataset, meta);

    // Bentuk paket snapshot sesuai Lampiran A PRD v4.1
    var isoTime = new Date(timestampMs).toISOString();
    var snapshotPackage = {
      snapshot_id: 'SNAP-C' + this.currentCycle + '-' + this.currentScenario + '-' + timestampMs,
      timestamp: isoTime,
      source_type: 'SIMULATION',
      trainset_id: meta.trainset_id,
      trip_id: meta.trip_id,
      direction: (Constants && Constants.DIRECTION) || 'Yogyakarta → Palur',
      scenario_id: this.currentScenario,
      cycle_number: this.currentCycle,
      tick_index: tickIndex,
      ranked_carriages: recommendation.rankedCarriages,
      most_recommended: recommendation.mostRecommended ? recommendation.mostRecommended.carriage_id : null,
      has_over_capacity: recommendation.hasOverCapacity,
      all_high_density: recommendation.allHighDensity
    };

    this.activeScenarioSnapshots.push(snapshotPackage);
    HistoryStore.saveSnapshot(snapshotPackage);

    if (this.onTick) {
      this.onTick({
        engineState: this.getState(),
        recommendation: recommendation,
        snapshotPackage: snapshotPackage
      });
    }
  };

  /**
   * Penanganan penyelesaian skenario (180 detik tercapai).
   */
  SimulationEngine.prototype.handleScenarioCompletion = function (nowMs) {
    var completedScenario = this.currentScenario;
    var isoEnd = new Date(nowMs).toISOString();

    // Hitung rata-rata kepadatan per gerbong dari snapshot skenario ini
    var avgDensities = {};
    var carriages = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6'];
    for (var c = 0; c < carriages.length; c++) {
      avgDensities[carriages[c]] = 0;
    }

    var snapCount = this.activeScenarioSnapshots.length;
    if (snapCount > 0) {
      for (var s = 0; s < snapCount; s++) {
        var rCars = this.activeScenarioSnapshots[s].ranked_carriages || [];
        for (var k = 0; k < rCars.length; k++) {
          avgDensities[rCars[k].carriage_id] += rCars[k].occupancy_percent;
        }
      }
      for (var cid in avgDensities) {
        avgDensities[cid] = Math.round((avgDensities[cid] / snapCount) * 10) / 10;
      }
    }

    // Simpan ringkasan skenario ke HistoryStore
    var scenarioSummary = {
      scenario_id: completedScenario,
      cycle_number: this.currentCycle,
      start_time: new Date(this.scenarioStartTime).toISOString(),
      end_time: isoEnd,
      snapshot_count: snapCount,
      avg_occupancy_percent: avgDensities,
      status: 'COMPLETED'
    };
    HistoryStore.saveScenarioSummary(scenarioSummary);

    // Periksa apakah petugas telah meminta penghentian (Graceful Stop)
    if (this.stopRequested) {
      // Jika berhenti saat skenario Tinggi, siklus dicatat selesai
      if (completedScenario === 'HIGH') {
        this.completedCycles++;
        HistoryStore.saveCycleSummary({
          cycle_number: this.currentCycle,
          start_time: this.startTime,
          end_time: isoEnd,
          status: 'COMPLETED'
        });
      } else {
        HistoryStore.saveCycleSummary({
          cycle_number: this.currentCycle,
          start_time: this.startTime,
          end_time: isoEnd,
          status: 'STOPPED_BEFORE_COMPLETION'
        });
      }

      this.status = 'STOPPED';
      this.stopRequested = false;
      this.remainingSeconds = 0;

      if (this.timerHandle) {
        clearInterval(this.timerHandle);
        this.timerHandle = null;
      }

      HistoryStore.logTransition({
        timestamp: isoEnd,
        event: 'SIMULATION_STOPPED',
        from_scenario: completedScenario,
        to_scenario: null,
        cycle: this.currentCycle,
        status: this.status
      });

      if (this.onStatusChange) {
        this.onStatusChange(this.getState());
      }
      return;
    }

    // Jika simulasi berlanjut normal (Loop Otomatis)
    var nextScenario;
    if (completedScenario === 'LOW') {
      nextScenario = 'MEDIUM';
    } else if (completedScenario === 'MEDIUM') {
      nextScenario = 'HIGH';
    } else { // HIGH selesai -> Siklus selesai -> Looping ke LOW
      this.completedCycles++;
      HistoryStore.saveCycleSummary({
        cycle_number: this.currentCycle,
        start_time: this.startTime,
        end_time: isoEnd,
        status: 'COMPLETED'
      });
      this.currentCycle++;
      nextScenario = 'LOW';
    }

    // Log transisi
    HistoryStore.logTransition({
      timestamp: isoEnd,
      event: 'SCENARIO_TRANSITION',
      from_scenario: completedScenario,
      to_scenario: nextScenario,
      cycle: this.currentCycle,
      status: this.status
    });

    if (this.onScenarioTransition) {
      this.onScenarioTransition(completedScenario, nextScenario, this.currentCycle);
    }

    // Reset untuk skenario baru
    this.currentScenario = nextScenario;
    this.scenarioStartTime = nowMs;
    this.lastTickIndex = -1;
    this.remainingSeconds = SCENARIO_DURATION_SEC;
    this.activeScenarioSnapshots = [];

    if (this.onStatusChange) {
      this.onStatusChange(this.getState());
    }

    // Eksekusi tick awal skenario baru
    this.executeTick(0, nowMs);
  };

  /**
   * Meminta penghentian simulasi secara terkontrol (Graceful Stop).
   * Sistem menunggu skenario aktif selesai sampai 00:00 sebelum berhenti.
   */
  SimulationEngine.prototype.requestStop = function () {
    if (this.status !== 'RUNNING') {
      return false;
    }

    this.stopRequested = true;
    this.status = 'STOPPING_AFTER_SCENARIO';

    var now = this.timeProvider();
    HistoryStore.logTransition({
      timestamp: new Date(now).toISOString(),
      event: 'STOP_REQUESTED',
      from_scenario: this.currentScenario,
      to_scenario: null,
      cycle: this.currentCycle,
      status: this.status
    });

    if (this.onStatusChange) {
      this.onStatusChange(this.getState());
    }

    return true;
  };

  /**
   * Mengambil snapshot state engine saat ini.
   */
  SimulationEngine.prototype.getState = function () {
    return {
      status: this.status,
      statusLabel: this.status === 'RUNNING' ? 'Berjalan' :
                   this.status === 'STOPPING_AFTER_SCENARIO' ? 'Menunggu penyelesaian skenario' : 'Berhenti',
      currentScenario: this.currentScenario,
      scenarioName: (Presets[this.currentScenario] && Presets[this.currentScenario].name) || this.currentScenario,
      currentCycle: this.currentCycle,
      completedCycles: this.completedCycles,
      remainingSeconds: this.remainingSeconds,
      formattedCountdown: this.formatCountdown(this.remainingSeconds),
      startTime: this.startTime,
      stopRequested: this.stopRequested
    };
  };

  return SimulationEngine;
});
