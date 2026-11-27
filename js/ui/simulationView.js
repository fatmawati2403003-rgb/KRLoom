/**
 * KRL Density MVP - Simulation View Module (Tahap 4 Finalization)
 * Dokumen Acuan: PRD MVP Versi 4.1 Bab 9 & Instruksi QC Tahap 4
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../config/constants'),
      require('../core/calculator'),
      require('../engine/historyStore')
    );
  } else {
    root.KRL = root.KRL || {};
    root.KRL.SimulationView = factory(
      root.KRL.Constants,
      root.KRL.Calculator,
      root.KRL.HistoryStore
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Constants, Calculator, HistoryStore) {
  'use strict';

  var engineRef = null;

  /**
   * Update visual status kartu telemetri petugas.
   * 
   * @param {Object} state - State dari SimulationEngine
   */
  function updateTelemetryCards(state) {
    var statusElem = document.getElementById('telemetry-status');
    var scenarioElem = document.getElementById('telemetry-scenario');
    var countdownElem = document.getElementById('telemetry-countdown');
    var cycleElem = document.getElementById('telemetry-cycles');
    var startElem = document.getElementById('telemetry-start-time');
    var capElem = document.getElementById('telemetry-capacity');
    var btnStart = document.getElementById('btn-start-simulation');
    var btnStop = document.getElementById('btn-stop-simulation');

    if (statusElem) {
      statusElem.textContent = state.statusLabel;
      statusElem.className = 'status-value ' + 
        (state.status === 'RUNNING' ? 'color-density-low' : 
         state.status === 'STOPPING_AFTER_SCENARIO' ? 'color-density-medium' : 'color-text-muted');
    }

    if (scenarioElem) {
      scenarioElem.textContent = state.scenarioName;
    }

    if (countdownElem) {
      countdownElem.textContent = state.formattedCountdown;
    }

    if (cycleElem) {
      cycleElem.textContent = state.completedCycles + ' Siklus';
    }

    if (startElem) {
      startElem.textContent = Calculator.formatWibTime(state.startTime);
    }

    if (capElem) {
      capElem.textContent = '1.500 Orang (250/gerbong)';
    }

    // Status Tombol Kontrol
    if (btnStart && btnStop) {
      if (state.status === 'RUNNING') {
        btnStart.disabled = true;
        btnStart.classList.add('disabled');
        btnStop.disabled = false;
        btnStop.classList.remove('disabled');
      } else if (state.status === 'STOPPING_AFTER_SCENARIO') {
        btnStart.disabled = true;
        btnStart.classList.add('disabled');
        btnStop.disabled = true;
        btnStop.classList.add('disabled');
      } else { // STOPPED
        btnStart.disabled = false;
        btnStart.classList.remove('disabled');
        btnStop.disabled = true;
        btnStop.classList.add('disabled');
      }
    }

    // Periksa error LocalStorage
    var errAlert = document.getElementById('storage-error-alert');
    var lastErr = HistoryStore.getLastError();
    if (errAlert) {
      if (lastErr) {
        errAlert.classList.remove('hidden');
        errAlert.innerHTML = '<strong>⚠️ Peringatan Penyimpanan Browser:</strong> ' + lastErr;
      } else {
        errAlert.classList.add('hidden');
      }
    }
  }

  /**
   * Render tabel riwayat pergantian skenario (Event Log).
   */
  function renderTransitionLogs() {
    var tbody = document.getElementById('transition-logs-body');
    if (!tbody) return;

    var logs = HistoryStore.getTransitionLogs();
    if (!logs || logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Belum ada catatan pergantian skenario.</td></tr>';
      return;
    }

    // Tampilkan 15 log terbaru (reverse order)
    var recent = logs.slice(-15).reverse();
    var html = recent.map(function (log) {
      var eventLabel = log.event === 'SIMULATION_STARTED' ? 'Mulai Simulasi' :
                       log.event === 'SCENARIO_TRANSITION' ? 'Pergantian Skenario' :
                       log.event === 'STOP_REQUESTED' ? 'Permintaan Berhenti' :
                       log.event === 'SIMULATION_STOPPED' ? 'Simulasi Berhenti' : log.event;

      var detail = (log.from_scenario ? log.from_scenario + ' → ' : '') + (log.to_scenario || '-');

      return `
        <tr>
          <td>${Calculator.formatWibTime(log.timestamp)}</td>
          <td><strong>${eventLabel}</strong></td>
          <td>${detail}</td>
          <td>Siklus #${log.cycle || 1}</td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = html;
  }

  /**
   * Render tabel peninjau snapshot 10 detik (Snapshot Viewer).
   */
  function renderSnapshotTable() {
    var tbody = document.getElementById('snapshot-table-body');
    var countElem = document.getElementById('snapshot-count-badge');
    if (!tbody) return;

    var snapshots = HistoryStore.getSnapshots();
    if (countElem) {
      countElem.textContent = snapshots.length + ' Snapshot Tersimpan';
    }

    if (!snapshots || snapshots.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Belum ada snapshot simulasi yang tercatat.</td></tr>';
      return;
    }

    // Tampilkan 10 snapshot terbaru
    var recent = snapshots.slice(-10).reverse();
    var html = recent.map(function (snap) {
      var topRank = snap.most_recommended || '-';
      var carriagesSummary = (snap.ranked_carriages || []).map(function (c) {
        return c.carriage_id + ': ' + c.formatted_percent;
      }).join(' | ');

      return `
        <tr>
          <td>${Calculator.formatWibTime(snap.timestamp)}</td>
          <td>Siklus #${snap.cycle_number}</td>
          <td><span class="badge ${snap.scenario_id === 'LOW' ? 'badge-low' : snap.scenario_id === 'MEDIUM' ? 'badge-med' : 'badge-high'}">${snap.scenario_id}</span></td>
          <td>Tick #${snap.tick_index}</td>
          <td><strong>${topRank}</strong></td>
          <td style="font-size: 0.75rem;">${carriagesSummary}</td>
          <td>${snap.has_over_capacity ? '<span class="badge badge-over">Melebihi Kapasitas</span>' : '<span class="badge badge-normal">Normal</span>'}</td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = html;
  }

  /**
   * Menginisialisasi event listeners tombol kontrol pada Panel Petugas.
   * 
   * @param {Object} engine - Instance SimulationEngine
   */
  function initSimulationView(engine) {
    engineRef = engine;

    var btnStart = document.getElementById('btn-start-simulation');
    var btnStop = document.getElementById('btn-stop-simulation');
    var btnReset = document.getElementById('btn-reset-history');

    if (btnStart) {
      btnStart.addEventListener('click', function () {
        if (engineRef) {
          engineRef.startSimulation();
          renderTransitionLogs();
          renderSnapshotTable();
        }
      });
    }

    if (btnStop) {
      btnStop.addEventListener('click', function () {
        if (engineRef) {
          engineRef.requestStop();
          renderTransitionLogs();
        }
      });
    }

    // Reset Riwayat dengan Konfirmasi Sesuai QC 2.3 & TC-13/TC-14
    if (btnReset) {
      btnReset.addEventListener('click', function () {
        var confirmed = confirm(
          'Konfirmasi Reset Riwayat Simulasi:\n\n' +
          'Apakah Anda yakin ingin menghapus seluruh riwayat snapshot dan log simulasi di browser?\n\n' +
          'Catatan: Konfigurasi kapasitas asumsi (250 orang/gerbong), preset, dan aturan aplikasi tidak akan terhapus.'
        );

        if (confirmed) {
          HistoryStore.resetHistory();
          renderTransitionLogs();
          renderSnapshotTable();
          alert('Riwayat simulasi lokal di browser telah berhasil dibersihkan.');
        } else {
          // Batal: Tidak ada data yang dihapus (TC-13)
        }
      });
    }

    // Render kondisi awal
    updateTelemetryCards(engine.getState());
    renderTransitionLogs();
    renderSnapshotTable();
  }

  return {
    initSimulationView: initSimulationView,
    updateTelemetryCards: updateTelemetryCards,
    renderTransitionLogs: renderTransitionLogs,
    renderSnapshotTable: renderSnapshotTable
  };
});
