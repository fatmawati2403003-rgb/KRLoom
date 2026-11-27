/**
 * KRL Density MVP - Simulated Admin Authentication Module
 * 
 * CATATAN KEAMANAN & BATASAN PROTOTIPE:
 * Modul ini adalah simulasi autentikasi di sisi browser (client-side) semata-mata
 * untuk keperluan demonstrasi prototipe tugas akademik (MVP). Modul ini TIDAK aman
 * untuk sistem produksi nyata karena tidak memiliki enkripsi hashing di server,
 * token JWT bertandatangan kriptografis, maupun perlindungan backend sejati.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../config/constants'));
  } else {
    root.KRL = root.KRL || {};
    root.KRL.Auth = factory(root.KRL.Constants);
  }
})(typeof self !== 'undefined' ? self : this, function (Constants) {
  'use strict';

  var STORAGE_KEY = (Constants && Constants.STORAGE_KEYS && Constants.STORAGE_KEYS.ADMIN_SESSION) || 'krl_admin_session';
  var ADMIN_CFG = (Constants && Constants.ADMIN_SIMULATION) || {
    DEFAULT_USERNAME: 'admin',
    DEFAULT_PASSWORD: 'admin123',
    ROLE_LABEL: 'Petugas / Administrator KRL'
  };

  /**
   * Mendapatkan storage aktif (preferensi sessionStorage, fallback localStorage)
   */
  function getStorage() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
    } catch (e) {
      // Storage blocked or unavailable
    }
    return null;
  }

  /**
   * Memeriksa apakah admin saat ini terautentikasi.
   * @returns {boolean}
   */
  function isAuthenticated() {
    var storage = getStorage();
    if (!storage) return false;
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (!raw) {
        // Cek juga fallback di localStorage jika tersimpan di sana
        if (typeof window !== 'undefined' && window.localStorage && storage !== window.localStorage) {
          raw = window.localStorage.getItem(STORAGE_KEY);
        }
      }
      if (!raw) return false;
      var session = JSON.parse(raw);
      return !!(session && session.isAuthenticated && session.username);
    } catch (e) {
      return false;
    }
  }

  /**
   * Mengambil data profil sesi pengguna yang sedang login.
   * @returns {Object|null}
   */
  function getCurrentUser() {
    var storage = getStorage();
    if (!storage) return null;
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (!raw && typeof window !== 'undefined' && window.localStorage && storage !== window.localStorage) {
        raw = window.localStorage.getItem(STORAGE_KEY);
      }
      if (!raw) return null;
      var session = JSON.parse(raw);
      return session || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Melakukan login simulasi.
   * 
   * @param {string} username 
   * @param {string} password 
   * @returns {{ success: boolean, message: string, user: Object|null }}
   */
  function login(username, password) {
    var u = (username || '').trim();
    var p = (password || '').trim();

    if (!u) {
      return { success: false, message: 'Nama pengguna (username) atau email wajib diisi.', user: null };
    }
    if (!p) {
      return { success: false, message: 'Kata sandi (password) wajib diisi.', user: null };
    }

    // Validasi terhadap kredensial prototipe yang ditentukan
    if (u.toLowerCase() === ADMIN_CFG.DEFAULT_USERNAME.toLowerCase() && p === ADMIN_CFG.DEFAULT_PASSWORD) {
      var sessionData = {
        isAuthenticated: true,
        username: ADMIN_CFG.DEFAULT_USERNAME,
        role: 'admin',
        roleLabel: ADMIN_CFG.ROLE_LABEL,
        loginAt: new Date().toISOString(),
        isSimulatedAuth: true
      };

      var storage = getStorage();
      if (storage) {
        try {
          storage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        } catch (e) {
          console.warn('Gagal menyimpan sesi:', e);
        }
      }

      return {
        success: true,
        message: 'Login berhasil sebagai ' + ADMIN_CFG.ROLE_LABEL + '.',
        user: sessionData
      };
    }

    return {
      success: false,
      message: 'Username atau kata sandi tidak cocok. Gunakan kredensial demo: username "' + 
        ADMIN_CFG.DEFAULT_USERNAME + '" dan password "' + ADMIN_CFG.DEFAULT_PASSWORD + '".',
      user: null
    };
  }

  /**
   * Melakukan logout dan menghapus sesi.
   * @returns {boolean}
   */
  function logout() {
    try {
      if (typeof window !== 'undefined') {
        if (window.sessionStorage) window.sessionStorage.removeItem(STORAGE_KEY);
        if (window.localStorage) window.localStorage.removeItem(STORAGE_KEY);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    isSimulation: true,
    isAuthenticated: isAuthenticated,
    getCurrentUser: getCurrentUser,
    login: login,
    logout: logout
  };
});
