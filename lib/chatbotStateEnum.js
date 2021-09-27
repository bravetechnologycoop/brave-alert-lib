const CHATBOT_STATE = {
  STARTED: 'Started',
  WAITING_FOR_REPLY: 'Waiting for reply',
  RESPONDING: 'Responding',
  WAITING_FOR_CATEGORY: 'Waiting for incident category',
  WAITING_FOR_DETAILS: 'Waiting for incident details',
  COMPLETED: 'Completed',
}

module.exports = Object.freeze(CHATBOT_STATE)
