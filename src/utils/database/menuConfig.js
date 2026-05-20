// ==================== DATABASE MENU CONFIG ====================
// Customização de grupos, áudio do menu e ler mais do menu.

import fs from 'fs';
import { ensureJsonFileExists, loadJsonFile } from '../helpers.js';
import { GROUP_CUSTOMIZATION_FILE, MENU_AUDIO_FILE, MENU_LERMAIS_FILE } from '../paths.js';

// ==================== SISTEMA DE PERSONALIZAÇÃO DE GRUPO ====================

export const loadGroupCustomization = () => {
  ensureJsonFileExists(GROUP_CUSTOMIZATION_FILE, { enabled: false, groups: {} });
  return loadJsonFile(GROUP_CUSTOMIZATION_FILE);
};

export const saveGroupCustomization = (data) => {
  fs.writeFileSync(GROUP_CUSTOMIZATION_FILE, JSON.stringify(data, null, 2));
};

export const isGroupCustomizationEnabled = () => {
  const data = loadGroupCustomization();
  return data.enabled || false;
};

export const setGroupCustomizationEnabled = (enabled) => {
  const data = loadGroupCustomization();
  data.enabled = enabled;
  saveGroupCustomization(data);
  return data.enabled;
};

export const getGroupCustomization = (groupId) => {
  if (!isGroupCustomizationEnabled()) return null;
  const data = loadGroupCustomization();
  return data.groups[groupId] || null;
};

export const setGroupCustomName = (groupId, customName) => {
  const data = loadGroupCustomization();
  if (!data.groups[groupId]) {
    data.groups[groupId] = {};
  }
  data.groups[groupId].customName = customName;
  saveGroupCustomization(data);
  return true;
};

export const setGroupCustomPhoto = (groupId, photoPath) => {
  const data = loadGroupCustomization();
  if (!data.groups[groupId]) {
    data.groups[groupId] = {};
  }
  data.groups[groupId].customPhoto = photoPath;
  saveGroupCustomization(data);
  return true;
};

export const removeGroupCustomName = (groupId) => {
  const data = loadGroupCustomization();
  if (data.groups[groupId]) {
    delete data.groups[groupId].customName;
    if (Object.keys(data.groups[groupId]).length === 0) {
      delete data.groups[groupId];
    }
    saveGroupCustomization(data);
  }
  return true;
};

export const removeGroupCustomPhoto = (groupId) => {
  const data = loadGroupCustomization();
  if (data.groups[groupId]) {
    if (data.groups[groupId].customPhoto && fs.existsSync(data.groups[groupId].customPhoto)) {
      try {
        fs.unlinkSync(data.groups[groupId].customPhoto);
      } catch (error) {
        console.error('Erro ao remover foto física de customização de grupo:', error);
      }
    }
    delete data.groups[groupId].customPhoto;
    if (Object.keys(data.groups[groupId]).length === 0) {
      delete data.groups[groupId];
    }
    saveGroupCustomization(data);
  }
  return true;
};

// ============== SISTEMA DE ÁUDIO DO MENU ==============

export const loadMenuAudio = () => {
  ensureJsonFileExists(MENU_AUDIO_FILE, { enabled: false, audioPath: null });
  return loadJsonFile(MENU_AUDIO_FILE);
};

export const saveMenuAudio = (data) => {
  fs.writeFileSync(MENU_AUDIO_FILE, JSON.stringify(data, null, 2));
};

export const isMenuAudioEnabled = () => {
  const data = loadMenuAudio();
  return data.enabled && data.audioPath && fs.existsSync(data.audioPath);
};

export const getMenuAudioPath = () => {
  const data = loadMenuAudio();
  if (data.enabled && data.audioPath && fs.existsSync(data.audioPath)) {
    return data.audioPath;
  }
  return null;
};

export const setMenuAudio = (audioPath) => {
  const data = loadMenuAudio();
  data.enabled = true;
  data.audioPath = audioPath;
  saveMenuAudio(data);
  return true;
};

export const removeMenuAudio = () => {
  const data = loadMenuAudio();
  
  if (data.audioPath && fs.existsSync(data.audioPath)) {
    try {
      fs.unlinkSync(data.audioPath);
    } catch (error) {
      console.error('Erro ao remover áudio:', error);
    }
  }
  
  data.enabled = false;
  data.audioPath = null;
  saveMenuAudio(data);
  return true;
};

// ============== SISTEMA DE LER MAIS DO MENU ==============

export const loadMenuLerMais = () => {
  ensureJsonFileExists(MENU_LERMAIS_FILE, { enabled: true });
  return loadJsonFile(MENU_LERMAIS_FILE);
};

export const saveMenuLerMais = (data) => {
  fs.writeFileSync(MENU_LERMAIS_FILE, JSON.stringify(data, null, 2));
};

export const isMenuLerMaisEnabled = () => {
  const data = loadMenuLerMais();
  return data.enabled !== false;
};

export const setMenuLerMais = (enabled) => {
  const data = loadMenuLerMais();
  data.enabled = enabled;
  saveMenuLerMais(data);
  return data.enabled;
};

export const getMenuLerMaisText = () => {
  if (!isMenuLerMaisEnabled()) {
    return '';
  }
  return '‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎\n';
};
