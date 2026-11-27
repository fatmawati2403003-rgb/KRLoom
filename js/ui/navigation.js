/**
 * KRL Density MVP - Navigation Module (SPA Tab Switcher with Hash & Query Support)
 * Dokumen Acuan: PRD MVP v4.1 & Keputusan QC Bagian 2.1
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KRL = root.KRL || {};
    root.KRL.Navigation = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var activeTab = 'passenger';

  /**
   * Mengaktifkan tab yang dipilih.
   * 
   * @param {string} tabName - 'passenger' atau 'officer'
   */
  function switchTab(tabName) {
    if (tabName !== 'passenger' && tabName !== 'officer') {
      tabName = 'passenger';
    }

    activeTab = tabName;

    var passengerView = document.getElementById('view-passenger');
    var officerView = document.getElementById('view-officer');
    var tabBtnPassenger = document.getElementById('tab-btn-passenger');
    var tabBtnOfficer = document.getElementById('tab-btn-officer');

    if (!passengerView || !officerView || !tabBtnPassenger || !tabBtnOfficer) {
      return;
    }

    if (tabName === 'passenger') {
      passengerView.classList.remove('hidden');
      officerView.classList.add('hidden');
      
      tabBtnPassenger.classList.add('active');
      tabBtnPassenger.setAttribute('aria-selected', 'true');
      tabBtnOfficer.classList.remove('active');
      tabBtnOfficer.setAttribute('aria-selected', 'false');
    } else {
      officerView.classList.remove('hidden');
      passengerView.classList.add('hidden');
      
      tabBtnOfficer.classList.add('active');
      tabBtnOfficer.setAttribute('aria-selected', 'true');
      tabBtnPassenger.classList.remove('active');
      tabBtnPassenger.setAttribute('aria-selected', 'false');
    }
  }

  /**
   * Menginisialisasi event listener navigasi tab dan hash/query URL.
   */
  function initNavigation() {
    var tabBtnPassenger = document.getElementById('tab-btn-passenger');
    var tabBtnOfficer = document.getElementById('tab-btn-officer');

    if (tabBtnPassenger) {
      tabBtnPassenger.addEventListener('click', function () {
        switchTab('passenger');
        if (window.location && window.history && window.history.replaceState) {
          window.history.replaceState(null, null, '#passenger');
        }
      });
    }

    if (tabBtnOfficer) {
      tabBtnOfficer.addEventListener('click', function () {
        switchTab('officer');
        if (window.location && window.history && window.history.replaceState) {
          window.history.replaceState(null, null, '#officer');
        }
      });
    }

    // Periksa query param atau hash URL saat halaman dimuat
    var isOfficer = false;
    if (typeof window !== 'undefined' && window.location) {
      var search = window.location.search || '';
      var hash = window.location.hash || '';
      if (search.indexOf('tab=officer') !== -1 || hash === '#officer') {
        isOfficer = true;
      }
    }

    if (isOfficer) {
      switchTab('officer');
    } else {
      switchTab('passenger');
    }

    // Dengarkan event hashchange
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', function () {
        var h = window.location.hash;
        if (h === '#officer') {
          switchTab('officer');
        } else {
          switchTab('passenger');
        }
      });
    }
  }

  return {
    switchTab: switchTab,
    initNavigation: initNavigation,
    getActiveTab: function () { return activeTab; }
  };
});
