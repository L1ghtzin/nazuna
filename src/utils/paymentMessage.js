const MAX_PAYMENT_SCAN_DEPTH = 8;
const PAYMENT_MESSAGE_KEYS = new Set([
  "paymentInviteMessage",
  "requestPaymentMessage",
  "sendPaymentMessage",
]);

function canScanObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !(value instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(value)
  );
}

function hasPaymentMessageKey(value, depth = 0, seenObjects = new WeakSet()) {
  if (
    !canScanObject(value) ||
    depth > MAX_PAYMENT_SCAN_DEPTH ||
    seenObjects.has(value)
  ) {
    return false;
  }

  seenObjects.add(value);

  for (const [key, childValue] of Object.entries(value)) {
    if (key === "quotedMessage") {
      continue;
    }

    if (PAYMENT_MESSAGE_KEYS.has(key) && canScanObject(childValue)) {
      return true;
    }

    if (hasPaymentMessageKey(childValue, depth + 1, seenObjects)) {
      return true;
    }
  }

  return false;
}

const SIMPLE_MESSAGE_TYPES = new Set([
  "conversation",
  "extendedTextMessage",
  "stickerMessage",
  "audioMessage",
  "imageMessage",
  "videoMessage",
  "reactionMessage",
  "protocolMessage",
  "senderKeyDistributionMessage",
]);

export function hasPaymentMessage(webMessage) {
  let msg = webMessage?.message;
  if (!msg) return false;

  if (msg.protocolMessage?.editedMessage) {
    msg = msg.protocolMessage.editedMessage;
  }

  const topKeys = Object.keys(msg);
  if (topKeys.length === 1 && SIMPLE_MESSAGE_TYPES.has(topKeys[0])) {
    return false;
  }

  return hasPaymentMessageKey(msg);
}

function findQuotedPaymentContext(value, depth = 0, seenObjects = new WeakSet()) {
  if (
    !canScanObject(value) ||
    depth > MAX_PAYMENT_SCAN_DEPTH ||
    seenObjects.has(value)
  ) {
    return null;
  }

  seenObjects.add(value);

  const contextInfo = value.contextInfo;

  if (
    canScanObject(contextInfo) &&
    typeof contextInfo.participant === "string" &&
    canScanObject(contextInfo.quotedMessage) &&
    hasPaymentMessageKey(contextInfo.quotedMessage)
  ) {
    return {
      participant: contextInfo.participant,
      stanzaId:
        typeof contextInfo.stanzaId === "string"
          ? contextInfo.stanzaId
          : undefined,
    };
  }

  for (const [key, childValue] of Object.entries(value)) {
    if (key === "quotedMessage") {
      continue;
    }

    const found = findQuotedPaymentContext(childValue, depth + 1, seenObjects);

    if (found) {
      return found;
    }
  }

  return null;
}

export function getQuotedPaymentContext(webMessage) {
  let msg = webMessage?.message;
  if (msg?.protocolMessage?.editedMessage) {
    msg = msg.protocolMessage.editedMessage;
  }
  return findQuotedPaymentContext(msg);
}
