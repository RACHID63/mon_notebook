/* script.js — interface du carnet. Toute la logique de données vit dans store.js. */
(function () {
  'use strict';

  var store = window.NotebookStore;
  var state = store.load(window.localStorage);
  var locked = false;
  var pendingPhoto = '';

  var el = {
    body: document.body,
    lockStatus: document.getElementById('lock-status'),
    toggleLock: document.getElementById('toggle-lock'),
    toggleSettings: document.getElementById('toggle-settings'),
    settingsPanel: document.getElementById('settings-panel'),
    bgColor: document.getElementById('bg-color'),
    textColor: document.getElementById('text-color'),
    saveSettings: document.getElementById('save-settings'),
    newPassword: document.getElementById('new-password'),
    savePassword: document.getElementById('save-password'),
    exportJson: document.getElementById('export-json'),
    importJson: document.getElementById('import-json'),
    importFile: document.getElementById('import-file'),
    clearAll: document.getElementById('clear-all'),
    contentType: document.getElementById('content-type'),
    contentInput: document.getElementById('content-input'),
    photoRow: document.getElementById('photo-row'),
    photoFile: document.getElementById('photo-file'),
    photoUrl: document.getElementById('photo-url'),
    audioRow: document.getElementById('audio-row'),
    audioUrl: document.getElementById('audio-url'),
    saveContent: document.getElementById('save-content'),
    display: document.getElementById('content-display'),
    notesCount: document.getElementById('notes-count'),
    overlay: document.getElementById('lock-overlay'),
    unlockPassword: document.getElementById('unlock-password'),
    unlockBtn: document.getElementById('unlock-btn'),
    unlockError: document.getElementById('unlock-error'),
    flash: document.getElementById('flash')
  };

  var flashTimer = null;

  function flash(message, kind) {
    el.flash.textContent = message;
    el.flash.className = 'flash' + (kind === 'error' ? ' error' : '');
    el.flash.hidden = false;
    if (flashTimer) window.clearTimeout(flashTimer);
    flashTimer = window.setTimeout(function () {
      el.flash.hidden = true;
    }, 4000);
  }

  function persist() {
    state = store.save(window.localStorage, state);
  }

  function formatDate(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function typeLabel(type) {
    if (type === 'photo') return 'Photo';
    if (type === 'audio') return 'Audio';
    return 'Message';
  }

  function buildNoteCard(note) {
    var card = document.createElement('article');
    card.className = 'note note-' + note.type;

    var head = document.createElement('div');
    head.className = 'note-head';

    var badge = document.createElement('span');
    badge.className = 'badge badge-' + note.type;
    badge.textContent = typeLabel(note.type);

    var date = document.createElement('time');
    date.dateTime = note.createdAt;
    date.textContent = formatDate(note.createdAt);

    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'icon-btn danger';
    remove.title = 'Supprimer cette note';
    remove.setAttribute('aria-label', 'Supprimer cette note');
    remove.textContent = '✕';
    remove.addEventListener('click', function () {
      if (!window.confirm('Supprimer cette note ?')) return;
      state = store.removeNote(state, note.id);
      persist();
      render();
      flash('Note supprimée.');
    });

    head.appendChild(badge);
    head.appendChild(date);
    head.appendChild(remove);
    card.appendChild(head);

    if (note.type === 'photo' && note.media) {
      var img = document.createElement('img');
      img.className = 'note-photo';
      img.src = note.media;
      img.alt = note.text || 'Photo enregistrée';
      img.loading = 'lazy';
      card.appendChild(img);
    }

    if (note.type === 'audio' && note.media) {
      var audio = document.createElement('audio');
      audio.controls = true;
      audio.src = note.media;
      card.appendChild(audio);
    }

    if (note.text) {
      var body = document.createElement('p');
      body.className = 'note-text';
      body.textContent = note.text;
      card.appendChild(body);
    }

    return card;
  }

  function render() {
    el.body.style.backgroundColor = state.settings.background;
    el.body.style.color = state.settings.text;
    el.bgColor.value = state.settings.background;
    el.textColor.value = state.settings.text;

    el.notesCount.textContent = String(state.notes.length);
    el.lockStatus.textContent = locked ? 'Verrouillé' : 'Déverrouillé';
    el.lockStatus.className = 'badge' + (locked ? ' badge-locked' : ' badge-open');
    el.toggleLock.textContent = locked ? 'Déverrouiller' : 'Verrouiller';

    el.display.innerHTML = '';

    if (locked) {
      el.display.appendChild(el.overlay);
      el.overlay.hidden = false;
      el.unlockError.hidden = true;
      el.unlockPassword.value = '';
      return;
    }

    el.overlay.hidden = true;

    if (!state.notes.length) {
      var empty = document.createElement('p');
      empty.className = 'placeholder';
      empty.textContent = 'Aucune note pour le moment.';
      el.display.appendChild(empty);
      return;
    }

    state.notes.forEach(function (note) {
      el.display.appendChild(buildNoteCard(note));
    });
  }

  function currentTypeRows() {
    var type = el.contentType.value;
    el.photoRow.hidden = type !== 'photo';
    el.audioRow.hidden = type !== 'audio';
    el.contentInput.placeholder = type === 'photo'
      ? 'Légende de la photo (facultatif)…'
      : type === 'audio'
        ? 'Titre ou description (facultatif)…'
        : 'Écrivez votre message…';
  }

  function addNoteFromForm() {
    var type = el.contentType.value;
    var media = '';

    if (type === 'photo') {
      media = pendingPhoto || el.photoUrl.value.trim();
    } else if (type === 'audio') {
      media = el.audioUrl.value.trim();
    }

    var result = store.addNote(state, {
      type: type,
      text: el.contentInput.value,
      media: media
    });

    if (!result.ok) {
      flash(result.error, 'error');
      return;
    }

    state = store.save(window.localStorage, result.state);
    el.contentInput.value = '';
    el.photoUrl.value = '';
    el.audioUrl.value = '';
    el.photoFile.value = '';
    pendingPhoto = '';
    render();
    flash('Note ajoutée et enregistrée.');
  }

  el.toggleSettings.addEventListener('click', function () {
    el.settingsPanel.hidden = !el.settingsPanel.hidden;
  });

  el.saveSettings.addEventListener('click', function () {
    state = store.updateSettings(state, {
      background: el.bgColor.value,
      text: el.textColor.value
    });
    state = store.save(window.localStorage, state);
    render();
    flash('Couleurs enregistrées.');
  });

  el.savePassword.addEventListener('click', function () {
    var result = store.setPassword(state, el.newPassword.value);
    if (!result.ok) {
      flash(result.error, 'error');
      return;
    }
    state = store.save(window.localStorage, result.state);
    el.newPassword.value = '';
    flash('Mot de passe changé.');
  });

  el.exportJson.addEventListener('click', function () {
    var blob = new Blob([store.toJSON(state)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'mon-notebook-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    flash('Export téléchargé.');
  });

  el.importJson.addEventListener('click', function () {
    el.importFile.click();
  });

  el.importFile.addEventListener('change', function () {
    var file = el.importFile.files && el.importFile.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var result = store.fromJSON(String(reader.result));
      if (!result.ok) {
        flash(result.error, 'error');
        return;
      }
      state = store.save(window.localStorage, result.state);
      render();
      flash('Import terminé : ' + state.notes.length + ' note(s).');
    };
    reader.readAsText(file);
    el.importFile.value = '';
  });

  el.clearAll.addEventListener('click', function () {
    if (!window.confirm('Effacer toutes les notes ? Cette action est définitive.')) return;
    state = store.clearNotes(state);
    state = store.save(window.localStorage, state);
    render();
    flash('Toutes les notes ont été effacées.');
  });

  el.contentType.addEventListener('change', currentTypeRows);

  el.photoFile.addEventListener('change', function () {
    var file = el.photoFile.files && el.photoFile.files[0];
    if (!file) {
      pendingPhoto = '';
      return;
    }
    if (file.size > store.MAX_PHOTO_BYTES) {
      flash('Image trop lourde (max 1,2 Mo) : utilisez plutôt une URL.', 'error');
      el.photoFile.value = '';
      pendingPhoto = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      pendingPhoto = String(reader.result);
      flash('Photo prête à être ajoutée.');
    };
    reader.readAsDataURL(file);
  });

  el.saveContent.addEventListener('click', addNoteFromForm);

  el.toggleLock.addEventListener('click', function () {
    if (!locked) {
      locked = true;
      render();
      el.unlockPassword.focus();
      return;
    }
    el.unlockPassword.focus();
  });

  function tryUnlock() {
    if (store.checkPassword(state, el.unlockPassword.value)) {
      locked = false;
      el.unlockPassword.value = '';
      render();
      flash('Notebook déverrouillé.');
    } else {
      el.unlockError.hidden = false;
      el.unlockPassword.select();
    }
  }

  el.unlockBtn.addEventListener('click', tryUnlock);
  el.unlockPassword.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') tryUnlock();
  });

  el.contentInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) addNoteFromForm();
  });

  currentTypeRows();
  render();
})();
