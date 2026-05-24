// ==================== DATABASE SUPPORT ====================
// Sistema de tickets de suporte: load/save, criar, aceitar, listar tickets.

import fs from 'fs';
import { ensureDirectoryExists, loadJsonFile, idsMatch , debouncedSaveJson} from '../helpers.js';
import { DATABASE_DIR, SUPPORT_TICKETS_FILE } from '../paths.js';

export const loadSupportTicketsData = () => {
  return loadJsonFile(SUPPORT_TICKETS_FILE, { groups: {} });
};

export const saveSupportTicketsData = (data) => {
  try {
    ensureDirectoryExists(DATABASE_DIR);
    debouncedSaveJson(SUPPORT_TICKETS_FILE, data, 1000);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar tickets de suporte:', error);
    return false;
  }
};

const ensureSupportGroupData = (data, groupId) => {
  if (!data.groups || typeof data.groups !== 'object') {
    data.groups = {};
  }
  if (!data.groups[groupId]) {
    data.groups[groupId] = {
      enabled: false,
      queue: [],
      tickets: {},
      lastId: 0
    };
  }
  const groupData = data.groups[groupId];
  groupData.enabled = !!groupData.enabled;
  groupData.queue = Array.isArray(groupData.queue) ? groupData.queue : [];
  groupData.tickets = typeof groupData.tickets === 'object' && groupData.tickets ? groupData.tickets : {};
  groupData.lastId = Number.isFinite(groupData.lastId) ? groupData.lastId : Number(groupData.lastId || 0);
  return groupData;
};

export const setSupportMode = (groupId, enabled) => {
  const data = loadSupportTicketsData();
  const groupData = ensureSupportGroupData(data, groupId);
  groupData.enabled = !!enabled;
  saveSupportTicketsData(data);
  return groupData.enabled;
};

export const findSupportTicketById = (ticketId) => {
  if (!ticketId) return null;
  const data = loadSupportTicketsData();
  const groups = data.groups || {};
  for (const [groupId, groupDataRaw] of Object.entries(groups)) {
    const groupData = ensureSupportGroupData(data, groupId);
    const ticket = groupData.tickets?.[ticketId];
    if (ticket) {
      return { ticket, groupId, data, groupData };
    }
  }
  return null;
};

export const createSupportTicket = ({ groupId, groupName, userId, userName, message }) => {
  if (!groupId || !userId) {
    return { success: false, message: 'Dados insuficientes para criar o ticket.' };
  }
  const data = loadSupportTicketsData();
  const groupData = ensureSupportGroupData(data, groupId);
  if (!groupData.enabled) {
    return { success: false, message: 'O modo de suporte não está ativo neste grupo.' };
  }

  const pendingTicketId = groupData.queue.find(id => {
    const t = groupData.tickets?.[id];
    return t && t.status === 'pending' && idsMatch(t.userId, userId);
  });

  if (pendingTicketId) {
    return {
      success: false,
      message: 'Você já possui um ticket pendente neste grupo.',
      existingTicket: groupData.tickets[pendingTicketId]
    };
  }

  const MAX_TICKET_ID = 99999;
  let nextId = Number.isFinite(groupData.lastId) ? groupData.lastId + 1 : 1;
  if (nextId < 1) nextId = 1;
  if (nextId > MAX_TICKET_ID) nextId = 1;

  let ticketId = String(nextId);
  const attemptsLimit = MAX_TICKET_ID;
  let attempts = 0;
  while (groupData.tickets?.[ticketId] && attempts < attemptsLimit) {
    nextId += 1;
    if (nextId > MAX_TICKET_ID) nextId = 1;
    ticketId = String(nextId);
    attempts += 1;
  }

  groupData.lastId = Number(ticketId);
  const ticket = {
    id: ticketId,
    groupId,
    groupName: groupName || null,
    userId,
    userName: userName || null,
    message: message || null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    acceptedBy: null,
    acceptedAt: null
  };

  groupData.tickets[ticketId] = ticket;
  const ahead = groupData.queue.length;
  groupData.queue.push(ticketId);
  saveSupportTicketsData(data);

  return {
    success: true,
    ticket,
    position: groupData.queue.length,
    ahead
  };
};

export const acceptSupportTicket = (ticketId, adminId) => {
  const found = findSupportTicketById(ticketId);
  if (!found || !found.ticket) {
    return { success: false, message: 'Ticket não encontrado.' };
  }

  const { ticket, data, groupData } = found;
  if (ticket.status === 'accepted') {
    return { success: false, alreadyAccepted: true, ticket };
  }

  ticket.status = 'accepted';
  ticket.acceptedBy = adminId;
  ticket.acceptedAt = new Date().toISOString();
  groupData.tickets[ticketId] = ticket;
  groupData.queue = (groupData.queue || []).filter(id => id !== ticketId);
  saveSupportTicketsData(data);

  return { success: true, ticket };
};

export const listSupportTickets = (groupId) => {
  const data = loadSupportTicketsData();
  const groupData = data.groups?.[groupId];
  if (!groupData || !groupData.queue || !groupData.tickets) return [];
  
  return groupData.queue
    .map(id => groupData.tickets[id])
    .filter(t => t && t.status === 'pending');
};
