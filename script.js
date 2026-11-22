document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    const lockBtn = document.getElementById('lock-btn');
    const saveSettingsBtn = document.getElementById('save-settings');
    const saveContentBtn = document.getElementById('save-content');
    const bgColorInput = document.getElementById('bg-color');
    const textColorInput = document.getElementById('text-color');
    const contentInput = document.getElementById('content-input');
    const contentTypeSelect = document.getElementById('content-type');
    const contentDisplay = document.getElementById('content-display');
    const notebookContainer = document.getElementById('notebook-container');

    let isLocked = false;
    let savedContent = null;

    // --- 1. Gestion du Mot de Passe ---
    lockBtn.addEventListener('click', () => {
        if (passwordInput.value === 'motdepasse') { // REMPLACEZ 'motdepasse' par votre mot de passe réel
            isLocked = true;
            notebookContainer.classList.add('locked');
            lockBtn.textContent = 'Déverrouiller';
            alert('Notebook verrouillé.');
        } else {
            alert('Mot de passe incorrect.');
        }
    });

    // --- 2. Gestion des Paramètres (Couleurs) ---
    saveSettingsBtn.addEventListener('click', () => {
        const bgColor = bgColorInput.value;
        const textColor = textColorInput.value;
        
        // Appliquer les couleurs au body ou au conteneur
        document.body.style.backgroundColor = bgColor;
        document.querySelector('.content-area').style.backgroundColor = bgColor;
        document.body.style.color = textColor; // Appliquer au corps pour le texte général

        alert('Paramètres de couleur sauvegardés !');
    });

    // --- 3. Gestion du Contenu ---
    saveContentBtn.addEventListener('click', () => {
        const type = contentTypeSelect.value;
        const content = contentInput.value.trim();

        if (!content) {
            alert('Veuillez entrer du contenu à sauvegarder.');
            return;
        }

        // Logique pour gérer les différents types de contenu
        let formattedContent = '';
        if (type === 'photo') {
            formattedContent = `[PHOTO : Image à insérer ici]`;
        } else if (type === 'audio') {
            formattedContent = `[AUDIO : Fichier audio à insérer ici]`;
        } else { // message
            formattedContent = `--- MESSAGE ÉCRIT ---\n${content}`;
        }

        savedContent = formattedContent;
        contentDisplay.innerHTML = formattedContent;
        console.log('Contenu sauvegardé:', formattedContent);
        alert('Contenu sauvegardé avec succès !');
    });
});