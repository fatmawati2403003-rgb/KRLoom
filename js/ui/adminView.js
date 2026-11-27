/**
 * KRL Density MVP - Admin Dashboard & Officer Control Module
 * Menangani Autentikasi Admin, CRUD Jadwal KRL, dan Integrasi Panel Mesin Simulasi
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../config/constants'),
      require('../core/calculator'),
      require('../core/auth'),
      require('../engine/scheduleStore'),
      require('../engine/simulationEngine'),
      require('./simulationView')
    );
  } else {
    root.KRL = root.KRL || {};
    root.KRL.AdminView = factory(
      root.KRL.Constants,
      root.KRL.Calculator,
      root.KRL.Auth,
      root.KRL.ScheduleStore,
      root.KRL.SimulationEngine,
      root.KRL.SimulationView
    );
  }
})(typeof self !== 'undefined' ? self : this, function (Constants, Calculator, Auth, ScheduleStore, SimulationEngine, SimulationView) {
  'use strict';

  var engineInstance = null;

  /**
   * Tampilkan pesan feedback aksi CRUD.
   */
  function showFeedback(message, isError) {
    var alertBox = document.getElementById('admin-feedback-alert');
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = 'alert ' + (isError ? 'alert-danger' : 'alert-success');
    alertBox.classList.remove('hidden');

    setTimeout(function () {
      if (alertBox) alertBox.classList.add('hidden');
    }, 4500);
  }

  /**
   * Menampilkan atau menyembunyikan modal.
   */
  function toggleModal(modalId, show) {
    var modal = document.getElementById(modalId);
    if (!modal) return;
    if (show) {
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }

  /**
   * Membuka form tambah jadwal.
   */
  function openAddModal() {
    var errorBox = document.getElementById('modal-add-error');
    if (errorBox) errorBox.classList.add('hidden');

    var form = document.getElementById('form-add-schedule');
    if (form) form.reset();

    var originSelect = document.getElementById('add-origin-station');
    var destSelect = document.getElementById('add-dest-station');
    if (originSelect && destSelect && ScheduleStore.STATIONS) {
      originSelect.value = ScheduleStore.STATIONS[0];
      destSelect.value = ScheduleStore.STATIONS[ScheduleStore.STATIONS.length - 1];
    }

    toggleModal('modal-add-schedule', true);
  }

  /**
   * Membuka form ubah jadwal.
   */
  function openEditModal(scheduleId) {
    var item = ScheduleStore.getById(scheduleId);
    if (!item) {
      showFeedback('Jadwal tidak ditemukan.', true);
      return;
    }

    var errorBox = document.getElementById('modal-edit-error');
    if (errorBox) errorBox.classList.add('hidden');

    document.getElementById('edit-schedule-id').value = item.id;
    document.getElementById('edit-train-number').value = item.trainNumber || '';
    document.getElementById('edit-trip-id').value = item.tripId || '';
    document.getElementById('edit-trainset-id').value = item.trainsetId || '';
    document.getElementById('edit-origin-station').value = item.originStation || '';
    document.getElementById('edit-dest-station').value = item.destinationStation || '';
    document.getElementById('edit-dep-time').value = item.departureTime || '';
    document.getElementById('edit-arr-time').value = item.arrivalTime || '';
    document.getElementById('edit-scenario').value = item.scenario || 'MEDIUM';
    document.getElementById('edit-notes').value = item.notes || '';

    toggleModal('modal-edit-schedule', true);
  }

  /**
   * Membuka dialog konfirmasi hapus jadwal.
   */
  function openDeleteConfirmModal(scheduleId) {
    var item = ScheduleStore.getById(scheduleId);
    if (!item) {
      showFeedback('Jadwal tidak ditemukan.', true);
      return;
    }

    document.getElementById('delete-schedule-id').value = item.id;
    document.getElementById('delete-schedule-name').textContent = 
      item.trainNumber + ' (' + item.originStation + ' → ' + item.destinationStation + ', ' + item.departureTime + ' WIB)';

    toggleModal('modal-confirm-delete', true);
  }

  /**
   * Render tabel jadwal KRL pada dashboard admin.
   */
  function renderScheduleTable() {
    var tbody = document.getElementById('admin-schedule-tbody');
    if (!tbody) return;

    var schedules = ScheduleStore.getAll();
    if (!schedules || schedules.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding: 24px;">Belum ada jadwal KRL yang tercatat.</td></tr>';
      return;
    }

    var html = schedules.map(function (item) {
      var scenBadgeClass = item.scenario === 'LOW' ? 'badge-low' : (item.scenario === 'HIGH' ? 'badge-high' : 'badge-normal');
      var scenLabel = item.scenario === 'LOW' ? 'Rendah' : (item.scenario === 'HIGH' ? 'Tinggi' : 'Sedang');

      return `
        <tr>
          <td><strong style="color: var(--color-primary-dark);">${item.trainNumber}</strong></td>
          <td>
            <div style="font-size: 0.8rem; font-family: monospace;">${item.tripId || '-'}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${item.trainsetId || '-'}</div>
          </td>
          <td>
            <div><strong>${item.originStation}</strong></div>
            <div style="font-size: 0.8rem; color: #475569;">Jam: ${item.departureTime} WIB</div>
          </td>
          <td>
            <div><strong>${item.destinationStation}</strong></div>
            <div style="font-size: 0.8rem; color: #475569;">Jam: ${item.arrivalTime} WIB</div>
          </td>
          <td><span class="badge ${scenBadgeClass}">${scenLabel}</span></td>
          <td style="font-size: 0.8rem; color: #475569;">${item.notes || '-'}</td>
          <td style="text-align: center; white-space: nowrap;">
            <button type="button" class="btn-action-edit" data-edit-id="${item.id}" title="Ubah Jadwal">
              ✏️ Ubah
            </button>
            <button type="button" class="btn-action-delete" data-delete-id="${item.id}" title="Hapus Jadwal" style="margin-left: 4px;">
              🗑️ Hapus
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = html;

    // Attach event listeners ke tombol Ubah & Hapus
    var editBtns = tbody.querySelectorAll('.btn-action-edit');
    editBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-edit-id');
        openEditModal(id);
      });
    });

    var deleteBtns = tbody.querySelectorAll('.btn-action-delete');
    deleteBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-delete-id');
        openDeleteConfirmModal(id);
      });
    });
  }

  /**
   * Isi pilihan dropdown stasiun pada modal tambah dan edit.
   */
  function populateModalStations() {
    var stations = ScheduleStore.STATIONS;
    var addOrigin = document.getElementById('add-origin-station');
    var addDest = document.getElementById('add-dest-station');
    var editOrigin = document.getElementById('edit-origin-station');
    var editDest = document.getElementById('edit-dest-station');

    var opts = stations.map(function (s) {
      return '<option value="' + s + '">' + s + '</option>';
    }).join('');

    if (addOrigin) addOrigin.innerHTML = opts;
    if (addDest) addDest.innerHTML = opts;
    if (editOrigin) editOrigin.innerHTML = opts;
    if (editDest) editDest.innerHTML = opts;

    if (addOrigin && addDest && stations.length > 1) {
      addOrigin.value = stations[0];
      addDest.value = stations[stations.length - 1];
    }
  }

  /**
   * Cek dan perbarui status tampilan autentikasi admin.
   */
  function checkAuthState() {
    var loginView = document.getElementById('admin-login-view');
    var dashboardView = document.getElementById('admin-dashboard-view');
    var greeting = document.getElementById('admin-user-greeting');

    var isAuth = Auth.isAuthenticated();

    if (!isAuth) {
      if (loginView) loginView.classList.remove('hidden');
      if (dashboardView) dashboardView.classList.add('hidden');
    } else {
      if (loginView) loginView.classList.add('hidden');
      if (dashboardView) dashboardView.classList.remove('hidden');

      var user = Auth.getCurrentUser();
      if (greeting && user) {
        greeting.textContent = 'Selamat bertugas, ' + (user.roleLabel || 'Administrator KRL');
      }

      renderScheduleTable();
    }
  }

  /**
   * Mengatur tab navigasi pada dashboard admin (Jadwal vs Mesin Simulasi).
   */
  function setupAdminTabs() {
    var tabSchedules = document.getElementById('tab-btn-schedules');
    var tabTelemetry = document.getElementById('tab-btn-telemetry');
    var panelSchedules = document.getElementById('panel-schedules');
    var panelTelemetry = document.getElementById('panel-telemetry');

    if (tabSchedules && tabTelemetry && panelSchedules && panelTelemetry) {
      tabSchedules.addEventListener('click', function () {
        tabSchedules.classList.add('active');
        tabSchedules.setAttribute('aria-selected', 'true');
        tabTelemetry.classList.remove('active');
        tabTelemetry.setAttribute('aria-selected', 'false');

        panelSchedules.classList.remove('hidden');
        panelTelemetry.classList.add('hidden');
      });

      tabTelemetry.addEventListener('click', function () {
        tabTelemetry.classList.add('active');
        tabTelemetry.setAttribute('aria-selected', 'true');
        tabSchedules.classList.remove('active');
        tabSchedules.setAttribute('aria-selected', 'false');

        panelTelemetry.classList.remove('hidden');
        panelSchedules.classList.add('hidden');
      });
    }
  }

  /**
   * Inisialisasi event listener form dan modal.
   */
  function setupEventListeners() {
    // 1. Form Login
    var loginForm = document.getElementById('admin-login-form');
    var loginError = document.getElementById('login-error-alert');
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var u = document.getElementById('login-username').value;
        var p = document.getElementById('login-password').value;

        var res = Auth.login(u, p);
        if (res.success) {
          if (loginError) loginError.classList.add('hidden');
          loginForm.reset();
          checkAuthState();
        } else {
          if (loginError) {
            loginError.textContent = res.message;
            loginError.classList.remove('hidden');
          }
        }
      });
    }

    // 2. Tombol Logout
    var logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        if (confirm('Apakah Anda ingin keluar dari dashboard petugas?')) {
          Auth.logout();
          checkAuthState();
        }
      });
    }

    // 3. Tombol Tutup Modal (Backdrop / close buttons)
    var closeButtons = document.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var modalId = btn.getAttribute('data-close-modal');
        toggleModal(modalId, false);
      });
    });

    // 4. Tombol Buka Modal Tambah
    var openAddBtn = document.getElementById('btn-open-add-modal');
    if (openAddBtn) {
      openAddBtn.addEventListener('click', openAddModal);
    }

    // 5. Submit Form Tambah Jadwal
    var formAdd = document.getElementById('form-add-schedule');
    if (formAdd) {
      formAdd.addEventListener('submit', function (e) {
        e.preventDefault();
        var trainNumber = document.getElementById('add-train-number').value;
        var tripId = document.getElementById('add-trip-id').value;
        var trainsetId = document.getElementById('add-trainset-id').value;
        var origin = document.getElementById('add-origin-station').value;
        var dest = document.getElementById('add-dest-station').value;
        var depTime = document.getElementById('add-dep-time').value;
        var arrTime = document.getElementById('add-arr-time').value;
        var scenario = document.getElementById('add-scenario').value;
        var notes = document.getElementById('add-notes').value;

        var addRes = ScheduleStore.add({
          trainNumber: trainNumber,
          tripId: tripId,
          trainsetId: trainsetId,
          originStation: origin,
          destinationStation: dest,
          departureTime: depTime,
          arrivalTime: arrTime,
          scenario: scenario,
          notes: notes
        });

        var errorBox = document.getElementById('modal-add-error');
        if (!addRes.success) {
          if (errorBox) {
            errorBox.textContent = addRes.message;
            errorBox.classList.remove('hidden');
          }
        } else {
          toggleModal('modal-add-schedule', false);
          renderScheduleTable();
          showFeedback(addRes.message, false);
        }
      });
    }

    // 6. Submit Form Ubah Jadwal
    var formEdit = document.getElementById('form-edit-schedule');
    if (formEdit) {
      formEdit.addEventListener('submit', function (e) {
        e.preventDefault();
        var id = document.getElementById('edit-schedule-id').value;
        var trainNumber = document.getElementById('edit-train-number').value;
        var tripId = document.getElementById('edit-trip-id').value;
        var trainsetId = document.getElementById('edit-trainset-id').value;
        var origin = document.getElementById('edit-origin-station').value;
        var dest = document.getElementById('edit-dest-station').value;
        var depTime = document.getElementById('edit-dep-time').value;
        var arrTime = document.getElementById('edit-arr-time').value;
        var scenario = document.getElementById('edit-scenario').value;
        var notes = document.getElementById('edit-notes').value;

        var updateRes = ScheduleStore.update(id, {
          trainNumber: trainNumber,
          tripId: tripId,
          trainsetId: trainsetId,
          originStation: origin,
          destinationStation: dest,
          departureTime: depTime,
          arrivalTime: arrTime,
          scenario: scenario,
          notes: notes,
          updateCarriagesWithScenario: true
        });

        var errorBox = document.getElementById('modal-edit-error');
        if (!updateRes.success) {
          if (errorBox) {
            errorBox.textContent = updateRes.message;
            errorBox.classList.remove('hidden');
          }
        } else {
          toggleModal('modal-edit-schedule', false);
          renderScheduleTable();
          showFeedback(updateRes.message, false);
        }
      });
    }

    // 7. Konfirmasi Hapus Jadwal
    var confirmDeleteBtn = document.getElementById('btn-confirm-delete-schedule');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', function () {
        var id = document.getElementById('delete-schedule-id').value;
        var delRes = ScheduleStore.delete(id);
        toggleModal('modal-confirm-delete', false);
        renderScheduleTable();
        showFeedback(delRes.message, !delRes.success);
      });
    }

    // 8. Reset ke Jadwal Default
    var resetSchedulesBtn = document.getElementById('btn-reset-schedules');
    if (resetSchedulesBtn) {
      resetSchedulesBtn.addEventListener('click', function () {
        if (confirm('Apakah Anda yakin ingin me-reset seluruh jadwal ke data awal prototipe?')) {
          var res = ScheduleStore.resetDefaults();
          renderScheduleTable();
          showFeedback(res.message, false);
        }
      });
    }
  }

  /**
   * Inisialisasi keseluruhan Dashboard Admin.
   */
  function initAdmin() {
    populateModalStations();
    setupAdminTabs();
    setupEventListeners();

    // Inisialisasi SimulationEngine di balik Dashboard Admin
    engineInstance = new SimulationEngine({
      onTick: function (tickData) {
        SimulationView.updateTelemetryCards(tickData.engineState);
        SimulationView.renderSnapshotTable();
      },
      onStatusChange: function (state) {
        SimulationView.updateTelemetryCards(state);
        SimulationView.renderTransitionLogs();
      },
      onScenarioTransition: function () {
        SimulationView.renderTransitionLogs();
      }
    });

    SimulationView.initSimulationView(engineInstance);
    checkAuthState();
  }

  document.addEventListener('DOMContentLoaded', initAdmin);

  return {
    initAdmin: initAdmin,
    checkAuthState: checkAuthState,
    renderScheduleTable: renderScheduleTable,
    openAddModal: openAddModal,
    openEditModal: openEditModal,
    openDeleteConfirmModal: openDeleteConfirmModal
  };
});
