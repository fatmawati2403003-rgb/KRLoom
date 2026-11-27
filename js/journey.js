/**
 * KRL Density — Journey Wizard Controller (journey.js)
 *
 * Mengelola alur 3-tahap pencarian perjalanan:
 *   Tahap 1 — Pemilihan stasiun keberangkatan & tujuan (dropdown)
 *   Tahap 2 — Daftar jadwal kereta yang tersedia
 *   Tahap 3 — Detail perjalanan (vertical timeline per stasiun)
 *
 * Data jadwal bersumber dari KRL.ScheduleData (scheduleData.js)
 * Data kepadatan diteruskan ke KRL.App (app.js) via handleSelectFromWizard()
 */
(function (root) {
  'use strict';

  var KRL = root.KRL || {};

  /* ──────────────────────────────────────────────────────────────────
     State Wizard
  ────────────────────────────────────────────────────────────────── */
  var wizardState = {
    step:              1,
    originStation:     '',
    destStation:       '',
    travelDate:        '',
    selectedTrain:     null   // Object dari scheduleData.searchSchedules()
  };

  /* ──────────────────────────────────────────────────────────────────
     Daftar Stasiun (13 stasiun resmi)
  ────────────────────────────────────────────────────────────────── */
  var STATIONS = [
    { name: 'Yogyakarta',   code: 'YK'  },
    { name: 'Lempuyangan',  code: 'LPN' },
    { name: 'Maguwo',       code: 'MGW' },
    { name: 'Brambanan',    code: 'BBN' },
    { name: 'Srowot',       code: 'SWT' },
    { name: 'Klaten',       code: 'KT'  },
    { name: 'Ceper',        code: 'CE'  },
    { name: 'Delanggu',     code: 'DL'  },
    { name: 'Gawok',        code: 'GW'  },
    { name: 'Purwosari',    code: 'PWS' },
    { name: 'Solo Balapan', code: 'SLO' },
    { name: 'Solo Jebres',  code: 'SK'  },
    { name: 'Palur',        code: 'PL'  }
  ];

  /* ──────────────────────────────────────────────────────────────────
     Helper: Format tanggal ke tampilan Indonesia
  ────────────────────────────────────────────────────────────────── */
  function formatDateIndo(dateStr) {
    if (!dateStr) return 'Hari Ini';
    var parts = dateStr.split('-');
    var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    var days  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    var months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
    return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ──────────────────────────────────────────────────────────────────
     Helper: Dapatkan today ISO string (YYYY-MM-DD)
  ────────────────────────────────────────────────────────────────── */
  function getTodayISO() {
    var d = new Date();
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }

  /* ═══════════════════════════════════════════════════════════════════
     PROGRESS INDICATOR
  ═══════════════════════════════════════════════════════════════════ */

  function updateProgress(currentStep) {
    for (var s = 1; s <= 3; s++) {
      var stepEl    = document.getElementById('prog-step-' + s);
      var connEl    = s < 3 ? document.getElementById('prog-conn-' + s) : null;
      if (!stepEl) continue;

      stepEl.classList.remove('active', 'completed');
      if (connEl) connEl.classList.remove('completed');

      if (s < currentStep) {
        stepEl.classList.add('completed');
        if (connEl) connEl.classList.add('completed');
      } else if (s === currentStep) {
        stepEl.classList.add('active');
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     NAVIGATE BETWEEN STEPS
  ═══════════════════════════════════════════════════════════════════ */

  function showStep(step) {
    for (var s = 1; s <= 3; s++) {
      var el = document.getElementById('step-' + s);
      if (el) {
        el.classList.toggle('hidden', s !== step);
      }
    }
    wizardState.step = step;
    updateProgress(step);

    // Scroll ke atas wizard
    var wizard = document.querySelector('.journey-wizard');
    if (wizard) {
      wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     TAHAP 1 — PEMILIHAN STASIUN
  ═══════════════════════════════════════════════════════════════════ */

  function populateDropdowns() {
    var origSel = document.getElementById('select-origin');
    var destSel = document.getElementById('select-destination');
    if (!origSel || !destSel) return;

    var optHtml = '<option value="">— Pilih Stasiun —</option>' +
      STATIONS.map(function (st) {
        return '<option value="' + st.name + '">' + st.name + ' (' + st.code + ')</option>';
      }).join('');

    origSel.innerHTML = optHtml;
    destSel.innerHTML = optHtml;
  }

  function validateStep1() {
    var origin = wizardState.originStation;
    var dest   = wizardState.destStation;
    var errEl  = document.getElementById('step1-error');
    var nextBtn = document.getElementById('btn-step1-next');

    if (!origin || !dest) {
      if (errEl) errEl.classList.add('hidden');
      if (nextBtn) nextBtn.disabled = true;
      return false;
    }

    if (origin === dest) {
      if (errEl) {
        errEl.textContent = 'Stasiun keberangkatan dan tujuan tidak boleh sama. Silakan pilih stasiun yang berbeda.';
        errEl.classList.remove('hidden');
      }
      if (nextBtn) nextBtn.disabled = true;
      return false;
    }

    if (errEl) errEl.classList.add('hidden');
    if (nextBtn) nextBtn.disabled = false;
    return true;
  }

  function updateDirectionIndicator() {
    var oEl = document.getElementById('dir-origin-short');
    var dEl = document.getElementById('dir-dest-short');
    if (!oEl || !dEl) return;

    var origin = wizardState.originStation;
    var dest   = wizardState.destStation;

    // Ambil kode stasiun
    var origCode = '';
    var destCode = '';
    for (var i = 0; i < STATIONS.length; i++) {
      if (STATIONS[i].name === origin) origCode = STATIONS[i].code;
      if (STATIONS[i].name === dest)   destCode = STATIONS[i].code;
    }

    oEl.textContent = origCode || origin || '—';
    dEl.textContent = destCode || dest   || '—';
  }

  function initStep1() {
    populateDropdowns();

    var origSel = document.getElementById('select-origin');
    var destSel = document.getElementById('select-destination');
    var swapBtn = document.getElementById('btn-swap');
    var nextBtn = document.getElementById('btn-step1-next');

    if (origSel) {
      origSel.addEventListener('change', function () {
        wizardState.originStation = origSel.value;
        updateDirectionIndicator();
        validateStep1();
      });
    }

    if (destSel) {
      destSel.addEventListener('change', function () {
        wizardState.destStation = destSel.value;
        updateDirectionIndicator();
        validateStep1();
      });
    }

    if (swapBtn) {
      swapBtn.addEventListener('click', function () {
        var tmp = wizardState.originStation;
        wizardState.originStation = wizardState.destStation;
        wizardState.destStation   = tmp;

        if (origSel) origSel.value = wizardState.originStation;
        if (destSel) destSel.value = wizardState.destStation;

        updateDirectionIndicator();
        validateStep1();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (!validateStep1()) return;
        goToStep2();
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     TAHAP 2 — DAFTAR JADWAL
  ═══════════════════════════════════════════════════════════════════ */

  function goToStep2() {
    // Update header
    var origName = document.getElementById('sched-origin-name');
    var destName = document.getElementById('sched-dest-name');
    if (origName) origName.textContent = wizardState.originStation;
    if (destName) destName.textContent = wizardState.destStation;

    // Set tanggal
    var dateInput = document.getElementById('input-travel-date');
    if (dateInput) {
      if (!wizardState.travelDate) {
        wizardState.travelDate = getTodayISO();
      }
      dateInput.value = wizardState.travelDate;
    }

    renderScheduleList();
    showStep(2);
  }

  function renderScheduleList() {
    var origin = wizardState.originStation;
    var dest   = wizardState.destStation;
    var container = document.getElementById('schedule-list-container');
    var emptyEl   = document.getElementById('schedule-empty');
    var countBadge = document.getElementById('schedule-count-badge');

    if (!container) return;

    var results = [];
    if (KRL.ScheduleData && KRL.ScheduleData.searchSchedules) {
      results = KRL.ScheduleData.searchSchedules(origin, dest);
    }

    if (countBadge) {
      countBadge.textContent = results.length > 0
        ? results.length + ' Perjalanan Tersedia'
        : 'Tidak ada jadwal';
    }

    if (results.length === 0) {
      container.innerHTML = '';
      if (emptyEl) {
        var emptyDesc = document.getElementById('empty-desc-text');
        if (emptyDesc) {
          emptyDesc.textContent =
            'Tidak ditemukan perjalanan dari Stasiun ' + origin +
            ' ke Stasiun ' + dest + '. ' +
            'Pastikan arah perjalanan sesuai atau coba tukar stasiun.';
        }
        emptyEl.classList.remove('hidden');
      }
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');

    var html = results.map(function (item) {
      return '<div class="schedule-row" data-train="' + item.trainNumber + '" ' +
        'role="button" tabindex="0" ' +
        'aria-label="' + item.trainNumber + ' berangkat ' + item.departureTime + '">' +
        '<div class="schedule-train-icon">🚆</div>' +
        '<div class="schedule-train-info">' +
          '<span class="schedule-train-number">' + item.trainNumber + '</span>' +
          '<span class="schedule-train-time">' + item.departureTime + ' WIB</span>' +
          '<span class="schedule-train-arrival">Tiba: ' + item.arrivalTime + ' WIB</span>' +
        '</div>' +
        '<div class="schedule-duration">' + item.durationDisplay + '</div>' +
        '<div class="schedule-arrow">›</div>' +
      '</div>';
    }).join('');

    container.innerHTML = html;

    // Pasang event listener
    var rows = container.querySelectorAll('.schedule-row');
    rows.forEach(function (row) {
      function selectRow() {
        var trainNum = row.getAttribute('data-train');
        goToStep3(trainNum);
      }
      row.addEventListener('click', selectRow);
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectRow();
        }
      });
    });
  }

  function initStep2() {
    var backBtn   = document.getElementById('btn-step2-back');
    var dateInput = document.getElementById('input-travel-date');

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        showStep(1);
      });
    }

    if (dateInput) {
      dateInput.addEventListener('change', function () {
        wizardState.travelDate = dateInput.value;
        // Re-render list (jadwal tidak berubah per tanggal karena jadwal terpublikasi,
        // tapi date dipersist untuk informasi pengguna)
        var countBadge = document.getElementById('schedule-count-badge');
        // Jadwal resmi sama setiap harinya (kecuali ada pengumuman khusus)
        // Date hanya untuk informasi kontekstual
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     TAHAP 3 — DETAIL PERJALANAN (VERTICAL TIMELINE)
  ═══════════════════════════════════════════════════════════════════ */

  function goToStep3(trainNumber) {
    var origin = wizardState.originStation;
    var dest   = wizardState.destStation;

    if (!KRL.ScheduleData || !KRL.ScheduleData.getFullRouteDetails) return;

    var routeData = KRL.ScheduleData.getFullRouteDetails(trainNumber, origin, dest);
    if (!routeData) return;

    wizardState.selectedTrain = {
      trainNumber:    routeData.trainNumber,
      originStation:  origin,
      destStation:    dest,
      departureTime:  routeData.userDepartureTime,
      arrivalTime:    routeData.userArrivalTime,
      travelDate:     wizardState.travelDate || getTodayISO(),
      direction:      routeData.direction,
      routeData:      routeData
    };

    renderDetail(routeData);
    showStep(3);
  }

  function renderDetail(routeData) {
    // Header info
    var nameEl    = document.getElementById('detail-train-name');
    var routeEl   = document.getElementById('detail-route');
    var depEl     = document.getElementById('detail-dep-time');
    var arrEl     = document.getElementById('detail-arr-time');

    if (nameEl) nameEl.textContent = routeData.trainNumber;
    if (routeEl) routeEl.textContent =
      wizardState.originStation + ' → ' + wizardState.destStation;
    if (depEl) depEl.textContent = routeData.userDepartureTime + ' WIB';
    if (arrEl) arrEl.textContent = routeData.userArrivalTime + ' WIB';

    // Render vertical timeline
    var wrapper = document.getElementById('timeline-wrapper');
    if (!wrapper) return;

    var html = routeData.stops.map(function (stop, idx) {
      var isOrigin  = stop.isUserOrigin;
      var isDest    = stop.isUserDestination;
      var isBetween = stop.isBetweenSelected;
      var isTerminal = (idx === 0 || idx === routeData.stops.length - 1);

      var stopClass = 'timeline-stop';
      if (isOrigin)       stopClass += ' is-user-origin';
      else if (isDest)    stopClass += ' is-user-destination';
      else if (isBetween) stopClass += ' is-between';
      else if (isTerminal) stopClass += ' is-terminal';
      else                stopClass += ' is-outside';

      // Highlight box
      var highlightHtml = '';
      if (isOrigin) {
        highlightHtml =
          '<div class="tl-highlight-origin">📍 Anda Berangkat dari Sini · ' + stop.departureTime + ' WIB</div>';
      } else if (isDest) {
        highlightHtml =
          '<div class="tl-highlight-dest">🎯 Stasiun Tujuan Anda · Tiba ' + stop.arrivalTime + ' WIB</div>';
      }

      // Ambil kode stasiun
      var stCode = '';
      for (var i = 0; i < STATIONS.length; i++) {
        if (STATIONS[i].name === stop.stationName) {
          stCode = STATIONS[i].code;
          break;
        }
      }

      return '<div class="' + stopClass + '">' +
        '<div class="tl-track">' +
          '<div class="tl-node"></div>' +
          '<div class="tl-line"></div>' +
        '</div>' +
        '<div class="tl-info">' +
          '<span class="tl-time">' + stop.timeDisplay + '</span>' +
          '<span class="tl-station-name">' + stop.stationName + '</span>' +
          (stCode ? '<span class="tl-station-code">' + stCode + '</span>' : '') +
          highlightHtml +
        '</div>' +
      '</div>';
    }).join('');

    wrapper.innerHTML = html;
  }

  function initStep3() {
    var backBtn    = document.getElementById('btn-step3-back');
    var selectBtn  = document.getElementById('btn-select-this-trip');

    if (backBtn) {
      backBtn.addEventListener('click', function () {
        showStep(2);
      });
    }

    if (selectBtn) {
      selectBtn.addEventListener('click', function () {
        handleSelectFromWizard();
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     INTEGRASI DENGAN FITUR KEPADATAN (app.js)
  ═══════════════════════════════════════════════════════════════════ */

  /**
   * handleSelectFromWizard — Meneruskan data perjalanan terpilih ke
   * modul kepadatan gerbong (KRL.App / app.js).
   *
   * Data yang diteruskan:
   *   - trainNumber     (nomor KA resmi)
   *   - originStation   (stasiun asal pengguna)
   *   - destStation     (stasiun tujuan pengguna)
   *   - departureTime   (jam berangkat dari stasiun asal)
   *   - arrivalTime     (jam tiba di stasiun tujuan)
   *   - travelDate      (tanggal perjalanan)
   *
   * Jadwal resmi tidak memiliki data sensor kepadatan real-time.
   * Data kepadatan yang ditampilkan adalah estimasi/simulasi prototipe.
   */
  function handleSelectFromWizard() {
    var trip = wizardState.selectedTrain;
    if (!trip) return;

    // Buat objek trip yang kompatibel dengan format yang dipakai app.js
    var tripObj = {
      id:                 trip.trainNumber,
      trainNumber:        trip.trainNumber,
      trainCode:          trip.trainNumber,
      tripId:             trip.trainNumber + '-' + (trip.travelDate || ''),
      trainsetId:         'CL-YK-' + trip.direction,
      originStation:      trip.originStation,
      destinationStation: trip.destStation,
      departureTime:      trip.departureTime,
      arrivalTime:        trip.arrivalTime,
      scenario:           'MEDIUM',   // default estimasi
      notes:              'Jadwal resmi KAI Commuter · ' + (trip.travelDate || ''),
      carriages: null     // null → app.js akan pakai preset skenario
    };

    // Update header
    updateHeaderInfo(trip);

    // Teruskan ke modul kepadatan (KRL.App dari app.js)
    if (KRL.App && typeof KRL.App.updateActiveTripDisplay === 'function') {
      KRL.App.updateActiveTripDisplay(tripObj);
    } else if (typeof updateActiveTripDisplay === 'function') {
      updateActiveTripDisplay(tripObj);
    }

    // Scroll ke bagian kepadatan
    var densitySection = document.getElementById('carriage-density-section');
    if (densitySection) {
      densitySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function updateHeaderInfo(trip) {
    var routeEl   = document.getElementById('header-route');
    var trainNoEl = document.getElementById('header-train-no');

    if (routeEl) {
      routeEl.textContent = trip.originStation + ' → ' + trip.destStation;
    }
    if (trainNoEl) {
      trainNoEl.textContent = trip.trainNumber +
        ' · ' + trip.departureTime + ' WIB';
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════════════ */

  function initJourneyWizard() {
    // Pastikan ScheduleData sudah dimuat
    if (!KRL.ScheduleData) {
      console.warn('[journey.js] KRL.ScheduleData belum tersedia. Pastikan scheduleData.js dimuat lebih awal.');
    }

    initStep1();
    initStep2();
    initStep3();

    // Tampilkan Tahap 1
    showStep(1);

    // Update "last-update-time" header
    var updateEl = document.getElementById('last-update-time');
    if (updateEl) {
      var now = new Date();
      var hh  = ('0' + now.getHours()).slice(-2);
      var mm  = ('0' + now.getMinutes()).slice(-2);
      updateEl.textContent = hh + ':' + mm + ' WIB';
    }
  }

  document.addEventListener('DOMContentLoaded', initJourneyWizard);

  /* Ekspor ke namespace global */
  root.KRL = root.KRL || {};
  root.KRL.Journey = {
    goToStep2:   goToStep2,
    goToStep3:   goToStep3,
    showStep:    showStep,
    wizardState: wizardState
  };

})(typeof self !== 'undefined' ? self : this);
