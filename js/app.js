/**
 * KRL Density MVP - Passenger Application Bootstrap
 * Terintegrasi Fitur Jadwal Kereta, Filter Waktu, dan Visualisasi Rute Vertikal (Access by KAI)
 */
(function (root) {
  'use strict';

  var KRL = root.KRL || {};
  var currentSelectedTrip = null;
  var activeScheduleFilter = {
    type: 'TODAY',
    fromTime: null,
    untilTime: null
  };
  var currentViewingScheduleId = null;

  /* ==========================================================================
     1. CARRIAGE DENSITY & RECOMMENDATIONS RENDERING
     ========================================================================== */

  /**
   * Render kartu gerbong pada halaman penumpang.
   * Aturan PRD v4.1 & Koreksi QC:
   * 1. Jika data tersedia: Kartu ditampilkan urut ranking dari kepadatan terendah ke tertinggi.
   * 2. Jika data tidak tersedia: Tampilkan keenam slot gerbong K1-K6 dalam status "Data Tidak Tersedia".
   */
  function renderCarriages(rankedCarriages, isAvailable) {
    var container = document.getElementById('carriage-grid');
    if (!container) return;

    if (!isAvailable || !rankedCarriages || rankedCarriages.length === 0) {
      var emptyCarriages = KRL.Constants.CARRIAGE_IDS;
      var unavailableHtml = emptyCarriages.map(function (cid) {
        return `
          <div class="carriage-card density-unavailable">
            <div class="carriage-header">
              <span class="carriage-title">Gerbong ${cid}</span>
              <span class="carriage-rank">Rank: --</span>
            </div>
            <div class="badges-row">
              <span class="badge badge-unavailable">Data Tidak Tersedia</span>
            </div>
            <div class="carriage-metric">
              <div class="percent-display">--%</div>
              <div class="category-display color-text-muted">Tidak Tersedia</div>
            </div>
            <div class="carriage-progress-bg">
              <div class="carriage-progress-bar" style="width: 0%;"></div>
            </div>
            <div class="carriage-details">
              <div><strong>Jumlah Penumpang:</strong> -- orang</div>
              <div><strong>Kapasitas Asumsi:</strong> 250 orang</div>
              <div class="source-tag">Sumber: ${KRL.Constants.SOURCE_TYPE}</div>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = unavailableHtml;
      return;
    }

    var sortedByRank = rankedCarriages.slice().sort(function (a, b) {
      return a.recommendation_rank - b.recommendation_rank;
    });

    var html = sortedByRank.map(function (c) {
      var overCapBadge = c.is_over_capacity ? 
        `<span class="badge badge-over">⚠️ ${KRL.Constants.MESSAGES.OVER_CAPACITY_WARNING}</span>` : '';
      
      var recBadge = c.is_most_recommended ? 
        `<span class="badge badge-recommended">★ ${KRL.Constants.MESSAGES.MOST_RECOMMENDED}</span>` : '';

      return `
        <div class="carriage-card ${c.css_class} ${c.is_over_capacity ? 'border-over' : ''}">
          <div class="carriage-header">
            <span class="carriage-title">Gerbong ${c.carriage_id}</span>
            <span class="carriage-rank">Rank #${c.recommendation_rank}</span>
          </div>

          <div class="badges-row">
            ${recBadge}
            ${overCapBadge}
          </div>

          <div class="carriage-metric">
            <div class="percent-display">${c.formatted_percent}</div>
            <div class="category-display color-${c.css_class}">${c.category_label}</div>
          </div>

          <div class="carriage-progress-bg">
            <div class="carriage-progress-bar bar-${c.css_class}" style="width: ${Math.min(c.occupancy_percent, 100)}%;"></div>
          </div>

          <div class="carriage-details">
            <div><strong>Jumlah Penumpang:</strong> ${c.passenger_count} orang</div>
            <div><strong>Kapasitas Asumsi:</strong> ${c.assumed_capacity} orang</div>
            <div class="source-tag">Sumber: ${KRL.Constants.SOURCE_TYPE}</div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  /**
   * Render kartu rekomendasi utama & banner peringatan.
   */
  function renderRecommendationSection(recommendationResult) {
    var recContainer = document.getElementById('recommendation-content');
    var alertContainer = document.getElementById('warning-banner-container');
    if (!recContainer || !alertContainer) return;

    if (!recommendationResult.isAvailable) {
      recContainer.innerHTML = `
        <div class="rec-card rec-unavailable">
          <div class="rec-badge" style="background: #94a3b8;">STATUS REKOMENDASI</div>
          <h3 class="rec-title" style="color: #64748b;">${KRL.Constants.MESSAGES.DATA_UNAVAILABLE}</h3>
          <p class="rec-desc">
            Rekomendasi gerbong dihentikan sementara karena data tidak valid atau belum tersedia. Sistem menolak menampilkan estimasi lama.
          </p>
          <div class="rec-order-box">
            <span class="order-label">Urutan Rekomendasi:</span>
            <div class="order-flow" style="color: #94a3b8;">-- Tidak Ada Rekomendasi --</div>
          </div>
        </div>
      `;
      alertContainer.innerHTML = '';
      return;
    }

    var best = recommendationResult.mostRecommended;
    var allRankedText = recommendationResult.rankedCarriages.map(function (c) {
      return `<strong>${c.carriage_id}</strong> (${c.formatted_percent})`;
    }).join(' &rarr; ');

    recContainer.innerHTML = `
      <div class="rec-card ${best.css_class}">
        <div class="rec-badge">PILIHAN REKOMENDASI TERBAIK</div>
        <h3 class="rec-title">Gerbong ${best.carriage_id} (${best.formatted_percent})</h3>
        <p class="rec-desc">
          Gerbong <strong>${best.carriage_id}</strong> memiliki persentase kepadatan terendah saat ini (${best.formatted_percent} dengan ${best.passenger_count} penumpang asumsi).
        </p>
        <div class="rec-order-box">
          <span class="order-label">Urutan Rekomendasi (Terendah ke Tertinggi):</span>
          <div class="order-flow">${allRankedText}</div>
        </div>
        <p class="rec-disclaimer">
          <em>Catatan: Rekomendasi disusun murni berdasarkan persentase kepadatan terendah untuk demonstrasi konsep tugas akademik.</em>
        </p>
      </div>
    `;

    if (recommendationResult.warningBanner) {
      var bannerClass = recommendationResult.warningBanner.type === 'ALL_HIGH' ? 'alert-danger' : 'alert-warning';
      alertContainer.innerHTML = `
        <div class="alert ${bannerClass}">
          <strong>⚠️ ${recommendationResult.warningBanner.message}</strong>
          <p>${recommendationResult.warningBanner.description}</p>
        </div>
      `;
    } else {
      alertContainer.innerHTML = '';
    }
  }

  function updateLastUpdateHeader(timestamp, extraText) {
    var updateTimeElem = document.getElementById('last-update-time');
    if (updateTimeElem) {
      var wibStr = KRL.Calculator.formatWibTime(timestamp || new Date());
      updateTimeElem.textContent = wibStr + (extraText ? ' ' + extraText : '');
    }
  }

  /* ==========================================================================
     2. TRIP SELECTION & ACTIVE BANNER
     ========================================================================== */

  /**
   * Menampilkan metadata trip aktif pada header dan banner perjalanan.
   */
  function updateActiveTripDisplay(trip) {
    if (!trip) return;
    currentSelectedTrip = trip;

    // Header Meta
    var routeElem = document.getElementById('header-route');
    var trainNoElem = document.getElementById('header-train-no');
    var trainsetElem = document.getElementById('header-trainset');
    var tripIdElem = document.getElementById('header-trip-id');

    if (routeElem) routeElem.textContent = trip.originStation + ' → ' + trip.destinationStation;
    if (trainNoElem) trainNoElem.textContent = (trip.trainCode ? trip.trainCode + ' • ' : '') + trip.trainNumber;
    if (trainsetElem) trainsetElem.textContent = 'Trainset: ' + (trip.trainsetId || 'SIM-TS-01');
    if (tripIdElem) tripIdElem.textContent = 'Trip: ' + (trip.tripId || 'SIM-TRIP-001');

    // Banner Perjalanan Aktif
    var activeTitle = document.getElementById('active-trip-title');
    var activeTimes = document.getElementById('active-trip-times');
    var activeScenario = document.getElementById('active-trip-scenario');

    if (activeTitle) {
      activeTitle.textContent = (trip.trainCode ? trip.trainCode + ' - ' : '') + 
        trip.trainNumber + ' (' + trip.originStation + ' → ' + trip.destinationStation + ')';
    }
    if (activeTimes) {
      activeTimes.textContent = 'Berangkat: ' + trip.departureTime + ' WIB | Tiba: ' + trip.arrivalTime + ' WIB';
    }
    if (activeScenario) {
      var scenMap = { LOW: 'Rendah (Hijau)', MEDIUM: 'Sedang (Kuning)', HIGH: 'Tinggi (Merah)' };
      activeScenario.textContent = scenMap[trip.scenario] || trip.scenario;
    }

    // Evaluasi Kepadatan Gerbong Perjalanan Terpilih
    var carriages = trip.carriages;
    if (!carriages || carriages.length !== 6) {
      var presetPass = KRL.Presets && KRL.Presets.SCENARIO_PRESETS && KRL.Presets.SCENARIO_PRESETS[trip.scenario || 'LOW'] ?
        KRL.Presets.SCENARIO_PRESETS[trip.scenario || 'LOW'].passengers :
        KRL.Presets.getDeterministicPassengers('LOW', 0);

      carriages = KRL.Constants.CARRIAGE_IDS.map(function (cid) {
        return {
          carriage_id: cid,
          passenger_count: presetPass[cid] || 100,
          assumed_capacity: KRL.Constants.CAPACITY_PER_CARRIAGE,
          source_type: 'SIMULATION'
        };
      });
    }

    var rec = KRL.Recommender.generateRecommendations(carriages, {
      trainset_id: trip.trainsetId || KRL.Constants.TRAINSET_ID,
      trip_id: trip.tripId || KRL.Constants.TRIP_ID,
      source_type: 'SIMULATION'
    });

    renderCarriages(rec.rankedCarriages, rec.isAvailable);
    renderRecommendationSection(rec);
    updateLastUpdateHeader(new Date(), '(Jadwal Terpilih)');
  }

  /**
   * Menangani pemilihan perjalanan dari kartu jadwal hasil pencarian.
   */
  function handleSelectTrip(tripId) {
    var trip = KRL.ScheduleStore.getById(tripId);
    if (!trip) return;

    KRL.ScheduleStore.setActiveTrip(tripId);
    updateActiveTripDisplay(trip);

    // Perbarui tombol status terpilih pada kartu-kartu jadwal
    var allCards = document.querySelectorAll('.schedule-card');
    allCards.forEach(function (card) {
      var cardTripId = card.getAttribute('data-trip-id');
      var btn = card.querySelector('.btn-select-trip');
      if (cardTripId === tripId) {
        card.classList.add('active-selected');
        if (btn) {
          btn.classList.add('selected');
          btn.textContent = '✓ Sedang Dipilih';
        }
      } else {
        card.classList.remove('active-selected');
        if (btn) {
          btn.classList.remove('selected');
          btn.textContent = 'Pilih Perjalanan';
        }
      }
    });

    // Scroll halus ke bagian kepadatan gerbong
    var densitySection = document.getElementById('carriage-density-section');
    if (densitySection && typeof densitySection.scrollIntoView === 'function') {
      densitySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ==========================================================================
     3. ACCESS BY KAI VERTICAL TIMELINE ROUTE MODAL
     ========================================================================== */

  /**
   * Membuka modal visualisasi rute vertikal (Access by KAI style).
   */
  function openRouteModal(scheduleId) {
    var originSelect = document.getElementById('select-origin');
    var destSelect = document.getElementById('select-destination');
    var origin = originSelect ? originSelect.value : '';
    var dest = destSelect ? destSelect.value : '';

    var routeData = KRL.ScheduleStore.getTrainRouteDetails(scheduleId, origin, dest);
    if (!routeData) return;

    currentViewingScheduleId = scheduleId;

    var modal = document.getElementById('modal-route-view');
    var pathElem = document.getElementById('route-modal-path');
    var tagElem = document.getElementById('route-modal-train-tag');
    var scenarioElem = document.getElementById('route-modal-scenario-tag');
    var container = document.getElementById('vertical-timeline-container');

    if (pathElem) {
      pathElem.textContent = origin + ' ➔ ' + dest;
    }
    if (tagElem) {
      tagElem.textContent = (routeData.schedule.displayTrainName || 'COMMUTER LINE YOGYAKARTA') + 
        ' ' + (routeData.schedule.trainCode || '#701');
    }
    if (scenarioElem) {
      var scen = routeData.schedule.scenario || 'LOW';
      var scenLabels = { LOW: 'Kepadatan: Rendah', MEDIUM: 'Kepadatan: Sedang', HIGH: 'Kepadatan: Tinggi' };
      scenarioElem.textContent = scenLabels[scen] || ('Kepadatan: ' + scen);
    }

    // Render vertical timeline stops
    if (container) {
      var html = routeData.stops.map(function (stop) {
        var isOrigin = stop.isUserOrigin;
        var isDest = stop.isUserDestination;
        var inTrip = stop.isInUserTrip;

        var stopClass = '';
        if (isOrigin) stopClass += ' is-origin';
        if (isDest) stopClass += ' is-destination';
        if (inTrip) stopClass += ' in-user-route';

        var transitBadge = stop.isTransit ? '<span class="tag-transit">• Transit</span>' : '';
        var airportBadge = stop.isAirport ? '<span class="tag-transit" style="background:#e0f2fe;color:#0369a1;">✈️ Bandara</span>' : '';

        var highlightBox = '';
        if (isOrigin) {
          highlightBox = `
            <div class="highlight-you-are-here">
              <span class="you-are-here-label">📍 Anda Berangkat dari Sini</span>
              <span class="you-are-here-sub">Keberangkatan: ${stop.departureTime} WIB</span>
            </div>
          `;
        } else if (isDest) {
          highlightBox = `
            <div class="highlight-destination">
              <span class="dest-highlight-label">🎯 Stasiun Tujuan Anda</span>
              <span class="dest-highlight-label" style="font-size: 0.75rem; color: #991b1b;">Kedatangan: ${stop.arrivalTime} WIB</span>
            </div>
          `;
        }

        return `
          <div class="timeline-stop ${stopClass}" data-station="${stop.name}">
            <div class="timeline-track-col">
              <div class="timeline-node"></div>
              <div class="timeline-line"></div>
            </div>
            <div class="timeline-stop-info">
              <div class="stop-main-row">
                <span class="stop-station-name">${stop.name}</span>
                <span class="stop-time-display">${stop.time} WIB</span>
              </div>
              <div class="stop-badges-row">
                <span class="tag-station-code">${stop.code}</span>
                ${transitBadge}
                ${airportBadge}
              </div>
              ${highlightBox}
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = html;
    }

    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  function closeRouteModal() {
    var modal = document.getElementById('modal-route-view');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  /* ==========================================================================
     4. SCHEDULE SEARCH & RESULTS
     ========================================================================== */

  /**
   * Render kartu-kartu jadwal hasil pencarian.
   */
  function renderScheduleResults(results, searchOrigin, searchDest) {
    var container = document.getElementById('schedule-cards-list');
    var emptyBox = document.getElementById('schedule-empty-state');
    var countText = document.getElementById('results-count-text');
    var resultsArea = document.getElementById('search-results-area');
    var originTitle = document.getElementById('res-origin-title');
    var destTitle = document.getElementById('res-dest-title');

    if (!container || !resultsArea) return;
    resultsArea.classList.remove('hidden');

    if (originTitle) originTitle.textContent = searchOrigin;
    if (destTitle) destTitle.textContent = searchDest;

    if (countText) {
      countText.textContent = results.length + ' Perjalanan';
    }

    if (results.length === 0) {
      container.innerHTML = '';
      if (emptyBox) {
        var emptyDesc = document.getElementById('empty-state-desc');
        if (emptyDesc) {
          emptyDesc.textContent = 'Tidak ditemukan perjalanan KRL untuk rute dari Stasiun ' + 
            searchOrigin + ' ke Stasiun ' + searchDest + ' pada rentang waktu yang dipilih. Silakan sesuaikan pengaturan jadwal atau pilih stasiun lain.';
        }
        emptyBox.classList.remove('hidden');
      }
      return;
    }

    if (emptyBox) emptyBox.classList.add('hidden');

    var activeTripId = currentSelectedTrip ? currentSelectedTrip.id : null;

    var html = results.map(function (item) {
      var isSelected = activeTripId === item.id;
      var scenBadgeClass = item.scenario === 'LOW' ? 'badge-low' : (item.scenario === 'HIGH' ? 'badge-high' : 'badge-normal');
      var scenLabel = item.scenario === 'LOW' ? 'Kepadatan Rendah' : (item.scenario === 'HIGH' ? 'Kepadatan Tinggi' : 'Kepadatan Sedang');
      var trainCode = item.trainCode || '#701';

      return `
        <div class="schedule-card ${isSelected ? 'active-selected' : ''}" data-trip-id="${item.id}">
          <div class="train-identity">
            <div class="train-number-row">
              <span class="train-code-badge">${trainCode}</span>
              <span class="train-number">${item.displayTrainName || 'COMMUTER LINE YOGYAKARTA'}</span>
            </div>
            <span class="train-trip-code">${item.tripId || 'SIM-TRIP'}</span>
            <div class="train-tag-row">
              <span class="train-tag">${item.trainsetId || 'SIM-TS-01'}</span>
              <span class="badge ${scenBadgeClass}" style="font-size:0.7rem; padding: 2px 6px;">${scenLabel}</span>
            </div>
          </div>

          <div class="route-timeline">
            <div class="station-point">
              <div class="station-time">${item.departureTime} WIB</div>
              <div class="station-name">${item.searchOrigin}</div>
            </div>

            <div class="route-arrow">
              <div class="arrow-line"></div>
              <span class="duration-text">${item.durationDisplay}</span>
            </div>

            <div class="station-point">
              <div class="station-time">${item.arrivalTime} WIB</div>
              <div class="station-name">${item.searchDestination}</div>
            </div>
          </div>

          <div class="schedule-actions-group">
            <button type="button" class="btn-view-route" data-trip-id="${item.id}" title="Lihat peta rute dan pemberhentian kereta">
              <span>🗺️ Lihat Rute</span>
            </button>
            <button type="button" class="btn-select-trip ${isSelected ? 'selected' : ''}" data-trip-id="${item.id}">
              ${isSelected ? '✓ Sedang Dipilih' : 'Pilih Perjalanan'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;

    // Pasang listener pada tombol "Pilih Perjalanan"
    var selectBtns = container.querySelectorAll('.btn-select-trip');
    selectBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-trip-id');
        handleSelectTrip(id);
      });
    });

    // Pasang listener pada tombol "Lihat Rute"
    var viewRouteBtns = container.querySelectorAll('.btn-view-route');
    viewRouteBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-trip-id');
        openRouteModal(id);
      });
    });
  }

  /**
   * Menjalankan pencarian jadwal KRL dengan filter waktu.
   */
  function executeSearch() {
    var originSelect = document.getElementById('select-origin');
    var destSelect = document.getElementById('select-destination');
    var dateInput = document.getElementById('input-travel-date');
    var errorBox = document.getElementById('search-validation-error');
    var resultsArea = document.getElementById('search-results-area');
    var spinner = document.getElementById('schedule-loading-spinner');

    var origin = originSelect ? originSelect.value : '';
    var dest = destSelect ? destSelect.value : '';
    var dateVal = dateInput ? dateInput.value : '';

    if (spinner) spinner.classList.remove('hidden');

    setTimeout(function () {
      if (spinner) spinner.classList.add('hidden');

      var searchRes = KRL.ScheduleStore.search(origin, dest, dateVal, activeScheduleFilter);

      if (!searchRes.isValid) {
        if (errorBox) {
          errorBox.textContent = searchRes.error;
          errorBox.classList.remove('hidden');
        }
        if (resultsArea) resultsArea.classList.add('hidden');
        return;
      }

      if (errorBox) errorBox.classList.add('hidden');
      renderScheduleResults(searchRes.results, origin, dest);
    }, 100);
  }

  /* ==========================================================================
     5. ACCESS BY KAI SEARCH & AUTOCOMPLETE CONTROLS
     ========================================================================== */

  /**
   * Render autocomplete rekomendasi stasiun saat mengetik.
   */
  function renderStationRecommendations(targetType, query) {
    var dropdown = document.getElementById(targetType === 'origin' ? 'origin-recommendations' : 'dest-recommendations');
    if (!dropdown) return;

    var matches = KRL.ScheduleStore.searchStations(query);

    if (matches.length === 0) {
      dropdown.innerHTML = '<div style="padding: 12px; color: #94a3b8; font-size: 0.85rem; text-align: center;">Stasiun tidak ditemukan</div>';
      dropdown.classList.remove('hidden');
      return;
    }

    var html = matches.map(function (item) {
      var transitTag = item.isTransit ? '<span class="tag-transit-sm">• Transit</span>' : '';
      var airportTag = item.isAirport ? '<span class="tag-transit-sm" style="background:#e0f2fe;color:#0369a1;">✈️ Bandara</span>' : '';

      return `
        <div class="station-rec-item" data-type="${targetType}" data-name="${item.name}">
          <div class="station-rec-main">
            <span class="station-rec-name">${item.name}</span>
            <div class="station-rec-meta">
              <span>${item.city}</span>
              ${transitTag}
              ${airportTag}
            </div>
          </div>
          <span class="station-code-badge">${item.code}</span>
        </div>
      `;
    }).join('');

    dropdown.innerHTML = html;
    dropdown.classList.remove('hidden');

    var recItems = dropdown.querySelectorAll('.station-rec-item');
    recItems.forEach(function (rec) {
      rec.addEventListener('click', function () {
        var sName = rec.getAttribute('data-name');
        setStationSelection(targetType, sName);
        dropdown.classList.add('hidden');
      });
    });
  }

  /**
   * Menetapkan pilihan stasiun asal atau tujuan.
   */
  function setStationSelection(targetType, stationName) {
    var detail = KRL.ScheduleStore.getStationDetail(stationName);
    var displayName = detail ? detail.name : stationName;
    var code = detail ? detail.code : '';
    var city = detail ? detail.city : '';

    if (targetType === 'origin') {
      var input = document.getElementById('input-origin-search');
      var select = document.getElementById('select-origin');
      var pill = document.getElementById('origin-selected-display');
      if (input) input.value = displayName;
      if (select) select.value = displayName;
      if (pill) {
        pill.innerHTML = `
          <span class="selected-code">${code}</span>
          <span class="selected-name">${displayName}</span>
          <span class="selected-city">${city}</span>
        `;
      }

      // Update quick destination suggestions
      renderQuickDestinations(displayName);
    } else {
      var inputDest = document.getElementById('input-dest-search');
      var selectDest = document.getElementById('select-destination');
      var pillDest = document.getElementById('dest-selected-display');
      if (inputDest) inputDest.value = displayName;
      if (selectDest) selectDest.value = displayName;
      if (pillDest) {
        pillDest.innerHTML = `
          <span class="selected-code">${code}</span>
          <span class="selected-name">${displayName}</span>
          <span class="selected-city">${city}</span>
        `;
      }
    }

    updateDirectionIndicator();
    executeSearch();
  }

  /**
   * Render kartu destinasi cepat (Quick Direct Routes) dari stasiun asal saat ini.
   */
  function renderQuickDestinations(originStation) {
    var container = document.getElementById('quick-dest-list');
    var box = document.getElementById('quick-destinations-box');
    if (!container) return;

    var dests = KRL.ScheduleStore.getAvailableDestinations(originStation);
    if (!dests || dests.length === 0) {
      if (box) box.classList.add('hidden');
      return;
    }

    if (box) box.classList.remove('hidden');

    var destSelect = document.getElementById('select-destination');
    var currentDest = destSelect ? destSelect.value : '';

    var html = dests.map(function (d) {
      var isActive = d.name === currentDest;
      return `
        <div class="quick-dest-card ${isActive ? 'active' : ''}" data-dest-name="${d.name}">
          <span>COMMUTER LINE</span>
          <span style="color:#0284c7;">•</span>
          <span>${originStation} → ${d.name} (${d.code})</span>
        </div>
      `;
    }).join('');

    container.innerHTML = html;

    var cards = container.querySelectorAll('.quick-dest-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var dName = card.getAttribute('data-dest-name');
        setStationSelection('destination', dName);
      });
    });
  }

  /**
   * Perbarui label indikator arah rute.
   */
  function updateDirectionIndicator() {
    var originSelect = document.getElementById('select-origin');
    var destSelect = document.getElementById('select-destination');
    var dirOriginElem = document.getElementById('dir-origin-name');
    var dirDestElem = document.getElementById('dir-dest-name');

    var o = originSelect ? originSelect.value : 'LEMPUYANGAN';
    var d = destSelect ? destSelect.value : 'YOGYAKARTA';

    if (dirOriginElem) dirOriginElem.textContent = o.toUpperCase();
    if (dirDestElem) dirDestElem.textContent = d.toUpperCase();
  }

  /* ==========================================================================
     6. ACCESS BY KAI SCHEDULE FILTER BOTTOM SHEET
     ========================================================================== */

  function openScheduleFilterModal() {
    var modal = document.getElementById('modal-schedule-filter');
    if (!modal) return;

    // Calculate dynamic next hour range
    var now = new Date();
    var curHours = now.getHours();
    var curMinutes = now.getMinutes();
    var nextHours = (curHours + 1) % 24;

    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var nowStr = pad(curHours) + ':' + pad(curMinutes);
    var nextStr = pad(nextHours) + ':' + pad(curMinutes);

    var nextHourLabel = document.getElementById('label-next-hour-range');
    if (nextHourLabel) {
      nextHourLabel.textContent = nowStr + ' - ' + nextStr;
    }

    // Set radio selection
    var radios = document.getElementsByName('schedule_filter_type');
    var customInputs = document.getElementById('custom-time-inputs-container');
    radios.forEach(function (r) {
      r.checked = (r.value === activeScheduleFilter.type);
      var card = r.closest('.schedule-radio-card');
      if (card) {
        if (r.checked) card.classList.add('selected');
        else card.classList.remove('selected');
      }
    });

    if (customInputs) {
      if (activeScheduleFilter.type === 'CUSTOM') {
        customInputs.classList.remove('hidden');
      } else {
        customInputs.classList.add('hidden');
      }
    }

    modal.classList.remove('hidden');
  }

  function closeScheduleFilterModal() {
    var modal = document.getElementById('modal-schedule-filter');
    if (modal) modal.classList.add('hidden');
  }

  function applyScheduleFilter() {
    var radios = document.getElementsByName('schedule_filter_type');
    var selectedType = 'TODAY';
    radios.forEach(function (r) {
      if (r.checked) selectedType = r.value;
    });

    var fromVal = null;
    var untilVal = null;

    if (selectedType === 'CUSTOM') {
      var fromInput = document.getElementById('filter-custom-from');
      var untilInput = document.getElementById('filter-custom-until');
      fromVal = fromInput ? fromInput.value : '06:00';
      untilVal = untilInput ? untilInput.value : '18:00';

      if (!fromVal || !untilVal) {
        alert('Harap masukkan waktu mulai dan waktu selesai.');
        return;
      }
    }

    activeScheduleFilter = {
      type: selectedType,
      fromTime: fromVal,
      untilTime: untilVal
    };

    // Update triggers display
    var labelElem = document.getElementById('current-filter-label');
    var badgeElem = document.getElementById('res-time-filter-badge');

    var filterText = 'Today (00:00 - 23:59)';
    if (selectedType === 'NEXT_HOUR') {
      var now = new Date();
      var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
      var nowStr = pad(now.getHours()) + ':' + pad(now.getMinutes());
      var nextStr = pad((now.getHours() + 1) % 24) + ':' + pad(now.getMinutes());
      filterText = 'Next Hour (' + nowStr + ' - ' + nextStr + ')';
    } else if (selectedType === 'CUSTOM') {
      filterText = fromVal + ' - ' + untilVal;
    }

    if (labelElem) labelElem.textContent = filterText;
    if (badgeElem) badgeElem.textContent = filterText;

    closeScheduleFilterModal();
    executeSearch();
  }

  /* ==========================================================================
     7. INITIALIZATION & EVENT WIRING
     ========================================================================== */

  function initScheduleSearchUI() {
    var stations = KRL.ScheduleStore.STATIONS;
    var originSelect = document.getElementById('select-origin');
    var destSelect = document.getElementById('select-destination');
    var originInput = document.getElementById('input-origin-search');
    var destInput = document.getElementById('input-dest-search');
    var dateInput = document.getElementById('input-travel-date');
    var swapBtn = document.getElementById('btn-swap-stations');

    // Populate fallback hidden selects
    if (originSelect && destSelect && stations) {
      var opts = stations.map(function (s) {
        return '<option value="' + s + '">' + s + '</option>';
      }).join('');
      originSelect.innerHTML = opts;
      destSelect.innerHTML = opts;

      // Default: Lempuyangan -> Yogyakarta (Access by KAI demo default)
      originSelect.value = 'Lempuyangan';
      destSelect.value = 'Yogyakarta';
    }

    if (originInput) originInput.value = 'Lempuyangan';
    if (destInput) destInput.value = 'Yogyakarta';

    setStationSelection('origin', 'Lempuyangan');
    setStationSelection('destination', 'Yogyakarta');

    // Date default today
    if (dateInput) {
      var today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }

    // Origin autocomplete input events
    if (originInput) {
      originInput.addEventListener('focus', function () {
        renderStationRecommendations('origin', originInput.value);
      });
      originInput.addEventListener('input', function () {
        renderStationRecommendations('origin', originInput.value);
      });
    }

    // Destination autocomplete input events
    if (destInput) {
      destInput.addEventListener('focus', function () {
        renderStationRecommendations('dest', destInput.value);
      });
      destInput.addEventListener('input', function () {
        renderStationRecommendations('dest', destInput.value);
      });
    }

    // Close autocomplete dropdown on click outside
    document.addEventListener('click', function (e) {
      var originRec = document.getElementById('origin-recommendations');
      var destRec = document.getElementById('dest-recommendations');
      var originIn = document.getElementById('input-origin-search');
      var destIn = document.getElementById('input-dest-search');

      if (originRec && originIn && !originRec.contains(e.target) && e.target !== originIn) {
        originRec.classList.add('hidden');
      }
      if (destRec && destIn && !destRec.contains(e.target) && e.target !== destIn) {
        destRec.classList.add('hidden');
      }
    });

    // Clear input buttons
    var clearOriginBtn = document.getElementById('btn-clear-origin');
    if (clearOriginBtn && originInput) {
      clearOriginBtn.addEventListener('click', function () {
        originInput.value = '';
        renderStationRecommendations('origin', '');
        originInput.focus();
      });
    }

    var clearDestBtn = document.getElementById('btn-clear-dest');
    if (clearDestBtn && destInput) {
      clearDestBtn.addEventListener('click', function () {
        destInput.value = '';
        renderStationRecommendations('dest', '');
        destInput.focus();
      });
    }

    // Swap stations button
    if (swapBtn && originSelect && destSelect) {
      swapBtn.addEventListener('click', function () {
        var temp = originSelect.value;
        var nextOrigin = destSelect.value;
        var nextDest = temp;

        setStationSelection('origin', nextOrigin);
        setStationSelection('destination', nextDest);
      });
    }

    // Filter modal trigger & controls
    var filterTrigger = document.getElementById('btn-open-schedule-filter');
    if (filterTrigger) {
      filterTrigger.addEventListener('click', openScheduleFilterModal);
    }

    var filterCloseBtn = document.getElementById('btn-close-schedule-modal');
    if (filterCloseBtn) {
      filterCloseBtn.addEventListener('click', closeScheduleFilterModal);
    }

    var filterBackdrop = document.getElementById('modal-schedule-filter');
    if (filterBackdrop) {
      filterBackdrop.addEventListener('click', function (e) {
        if (e.target === filterBackdrop) closeScheduleFilterModal();
      });
    }

    var applyFilterBtn = document.getElementById('btn-apply-schedule-filter');
    if (applyFilterBtn) {
      applyFilterBtn.addEventListener('click', applyScheduleFilter);
    }

    // Radio change handlers in filter modal
    var radios = document.getElementsByName('schedule_filter_type');
    var customInputs = document.getElementById('custom-time-inputs-container');
    radios.forEach(function (r) {
      r.addEventListener('change', function () {
        radios.forEach(function (other) {
          var c = other.closest('.schedule-radio-card');
          if (c) c.classList.remove('selected');
        });
        var currentCard = r.closest('.schedule-radio-card');
        if (currentCard) currentCard.classList.add('selected');

        if (customInputs) {
          if (r.value === 'CUSTOM') customInputs.classList.remove('hidden');
          else customInputs.classList.add('hidden');
        }
      });
    });

    // Reset filters from empty state
    var resetFiltersEmptyBtn = document.getElementById('btn-reset-filters-empty');
    if (resetFiltersEmptyBtn) {
      resetFiltersEmptyBtn.addEventListener('click', function () {
        activeScheduleFilter = { type: 'TODAY', fromTime: null, untilTime: null };
        var labelElem = document.getElementById('current-filter-label');
        var badgeElem = document.getElementById('res-time-filter-badge');
        if (labelElem) labelElem.textContent = 'Today (00:00 - 23:59)';
        if (badgeElem) badgeElem.textContent = '00:00 - 23:59';
        executeSearch();
      });
    }

    // Route view modal controls
    var closeRouteBtn = document.getElementById('btn-close-route-view');
    if (closeRouteBtn) {
      closeRouteBtn.addEventListener('click', closeRouteModal);
    }

    var routeModalBackdrop = document.getElementById('modal-route-view');
    if (routeModalBackdrop) {
      routeModalBackdrop.addEventListener('click', function (e) {
        if (e.target === routeModalBackdrop) closeRouteModal();
      });
    }

    var selectFromRouteBtn = document.getElementById('btn-select-trip-from-route');
    if (selectFromRouteBtn) {
      selectFromRouteBtn.addEventListener('click', function () {
        if (currentViewingScheduleId) {
          handleSelectTrip(currentViewingScheduleId);
          closeRouteModal();
        }
      });
    }

    // Initial search
    executeSearch();
  }

  function initApp() {
    // Inisialisasi kepadatan gerbong dengan default trip
    // (UI pencarian jadwal kini dikelola oleh journey.js)
    var activeTrip = KRL.ScheduleStore.getActiveTrip();
    if (activeTrip) {
      updateActiveTripDisplay(activeTrip);
    }

    // Inisialisasi Schedule Search UI lama hanya jika elemen lama masih ada
    // (backward compat — elemen utama sudah digantikan journey wizard)
    var legacyOriginInput = document.getElementById('input-origin-search');
    if (legacyOriginInput) {
      initScheduleSearchUI();
    }
  }

  document.addEventListener('DOMContentLoaded', initApp);

  root.KRL = KRL;
  root.KRL.App = {
    renderCarriages: renderCarriages,
    renderRecommendationSection: renderRecommendationSection,
    updateLastUpdateHeader: updateLastUpdateHeader,
    updateActiveTripDisplay: updateActiveTripDisplay,
    handleSelectTrip: handleSelectTrip,
    executeSearch: executeSearch,
    openRouteModal: openRouteModal,
    closeRouteModal: closeRouteModal,
    setStationSelection: setStationSelection,
    applyScheduleFilter: applyScheduleFilter
  };
})(typeof self !== 'undefined' ? self : this);
