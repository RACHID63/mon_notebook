/*
 * store.js — logique pure du carnet (aucune dépendance au DOM).
 * Utilisable dans le navigateur (window.NotebookStore) et sous Node (require).
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else if (root) {
    root.NotebookStore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STORAGE_KEY = 'mon_notebook_v1';
  var DEFAULT_PASSWORD = 'motdepasse';
  var MAX_PHOTO_BYTES = 1200 * 1024;
  var TYPES = ['message', 'photo', 'audio'];

  /* Verrou d'affichage : volontairement non cryptographique (voir README). */
  function hashPassword(value) {
    var text = 'notebook:' + String(value);
    var h = 5381;
    for (var i = 0; i < text.length; i += 1) {
      h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
    }
    return 'djb2:' + h.toString(16);
  }

  function nextId() {
    return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function isColor(value, fallback) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  }

  function createState() {
    return {
      version: 1,
      settings: { background: '#f0f0f0', text: '#333333' },
      passwordHash: hashPassword(DEFAULT_PASSWORD),
      notes: []
    };
  }

  function normalizeNote(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (TYPES.indexOf(raw.type) === -1) return null;
    var text = typeof raw.text === 'string' ? raw.text.slice(0, 20000).trim() : '';
    var media = typeof raw.media === 'string' ? raw.media.slice(0, 4000000) : '';
    if (!text && !media) return null;
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : nextId(),
      type: raw.type,
      text: text,
      media: media,
      createdAt: typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : new Date().toISOString()
    };
  }

  function normalize(raw) {
    var base = createState();
    if (!raw || typeof raw !== 'object') return base;
    var settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
    var notes = Array.isArray(raw.notes) ? raw.notes.map(normalizeNote).filter(Boolean) : [];
    return {
      version: 1,
      settings: {
        background: isColor(settings.background, base.settings.background),
        text: isColor(settings.text, base.settings.text)
      },
      passwordHash: typeof raw.passwordHash === 'string' && raw.passwordHash ? raw.passwordHash : base.passwordHash,
      notes: notes
    };
  }

  function load(storage) {
    if (!storage) return createState();
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (!raw) return createState();
      return normalize(JSON.parse(raw));
    } catch (error) {
      return createState();
    }
  }

  function save(storage, state) {
    var clean = normalize(state);
    if (storage) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(clean));
      } catch (error) {
        return clean; /* quota dépassé : on ne casse pas l'interface */
      }
    }
    return clean;
  }

  function validateNote(input) {
    var data = input && typeof input === 'object' ? input : {};
    var type = TYPES.indexOf(data.type) === -1 ? 'message' : data.type;
    var text = typeof data.text === 'string' ? data.text.trim() : '';
    var media = typeof data.media === 'string' ? data.media.trim() : '';

    if (type === 'message' && !text) {
      return { ok: false, error: 'Écrivez un message avant d’ajouter une note.' };
    }
    if (type === 'photo' && !media) {
      return { ok: false, error: 'Ajoutez une photo (fichier ou URL).' };
    }
    if (type === 'photo' && media.length > MAX_PHOTO_BYTES * 1.4) {
      return { ok: false, error: 'Photo trop lourde : choisissez une image de moins de 1,2 Mo.' };
    }
    if (type === 'audio' && !media) {
      return { ok: false, error: 'Collez l’URL d’un fichier audio.' };
    }
    if (type === 'audio' && !/^https?:\/\//i.test(media)) {
      return { ok: false, error: 'L’URL audio doit commencer par http:// ou https://' };
    }
    return {
      ok: true,
      note: {
        id: nextId(),
        type: type,
        text: text,
        media: media,
        createdAt: new Date().toISOString()
      }
    };
  }

  function addNote(state, input) {
    var result = validateNote(input);
    if (!result.ok) return { ok: false, error: result.error, state: state };
    var next = normalize(state);
    next.notes = [result.note].concat(next.notes);
    return { ok: true, state: next, note: result.note };
  }

  function removeNote(state, id) {
    var next = normalize(state);
    next.notes = next.notes.filter(function (note) {
      return note.id !== id;
    });
    return next;
  }

  function clearNotes(state) {
    var next = normalize(state);
    next.notes = [];
    return next;
  }

  function updateSettings(state, settings) {
    var next = normalize(state);
    var data = settings && typeof settings === 'object' ? settings : {};
    next.settings = {
      background: isColor(data.background, next.settings.background),
      text: isColor(data.text, next.settings.text)
    };
    return next;
  }

  function setPassword(state, plainPassword) {
    var next = normalize(state);
    var value = typeof plainPassword === 'string' ? plainPassword.trim() : '';
    if (value.length < 4) {
      return { ok: false, error: 'Le mot de passe doit contenir au moins 4 caractères.', state: state };
    }
    next.passwordHash = hashPassword(value);
    return { ok: true, state: next };
  }

  function checkPassword(state, plainPassword) {
    var current = normalize(state).passwordHash;
    return current === hashPassword(typeof plainPassword === 'string' ? plainPassword : '');
  }

  function toJSON(state) {
    return JSON.stringify(normalize(state), null, 2);
  }

  function fromJSON(text) {
    try {
      var parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        return { ok: false, error: 'Fichier illisible : objet JSON attendu.' };
      }
      if (!Array.isArray(parsed.notes)) {
        return { ok: false, error: 'Fichier illisible : la clé « notes » est absente.' };
      }
      return { ok: true, state: normalize(parsed) };
    } catch (error) {
      return { ok: false, error: 'Fichier illisible : ce n’est pas du JSON valide.' };
    }
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_PASSWORD: DEFAULT_PASSWORD,
    MAX_PHOTO_BYTES: MAX_PHOTO_BYTES,
    TYPES: TYPES,
    hashPassword: hashPassword,
    createState: createState,
    normalize: normalize,
    load: load,
    save: save,
    validateNote: validateNote,
    addNote: addNote,
    removeNote: removeNote,
    clearNotes: clearNotes,
    updateSettings: updateSettings,
    setPassword: setPassword,
    checkPassword: checkPassword,
    toJSON: toJSON,
    fromJSON: fromJSON
  };
});
