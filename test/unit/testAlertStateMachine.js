const expect = require('chai').expect
const { beforeEach, describe, it } = require('mocha')

const CHATBOT_STATE = require('../../lib/chatbotStateEnum')
const AlertStateMachine = require('../../lib/alertStateMachine')

function dummyGetReturnMessageToRespondedByPhoneNumber(language, fromAlertState, toAlertState, incidentCategories) {
  return `To RespondedByPhoneNumber (${language}): ${fromAlertState} --> ${toAlertState} with ${JSON.stringify(incidentCategories)}`
}

function dummyGetReturnMessageToOtherResponderPhoneNumbers(language, fromAlertState, toAlertState, selectedIncidentCategory) {
  return `To OtherResponderPhoneNumbers (${language}): ${fromAlertState} --> ${toAlertState} with "${selectedIncidentCategory}"`
}

function dummyGetClientMessageForRequestToReset(language) {
  return `Reset (${language})`
}

const dummyIncidentCategoryKeys = ['1', '2', '3', '4']
const dummyIncidentCategories = ['One', 'Two', 'Three', 'Four']
const dummyLanguage = 'my_lng'

describe('alertStateMachine.js unit tests:', () => {
  describe('constructor', () => {
    beforeEach(() => {
      this.alertStateMachine = new AlertStateMachine(
        () => 'to respondedByPhoneNumber',
        () => 'to others',
        () => 'reset',
      )
    })

    it('should be able to call the getReturnMessageToRespondedByPhoneNumber function set in the constructor', () => {
      expect(this.alertStateMachine.getReturnMessageToRespondedByPhoneNumber()).to.equal('to respondedByPhoneNumber')
    })

    it('should be able to call the getReturnMessageToOtherResponderPhoneNumbers function set in the constructor', () => {
      expect(this.alertStateMachine.getReturnMessageToOtherResponderPhoneNumbers()).to.equal('to others')
    })

    it('should be able to call the getClientMessageForRequestToReset function set in the constructor', () => {
      expect(this.alertStateMachine.getClientMessageForRequestToReset()).to.equal('reset')
    })
  })

  describe('processStateTransitionWithMessage where getClientMessageForRequestToReset returns null', () => {
    beforeEach(() => {
      this.alertStateMachine = new AlertStateMachine(
        dummyGetReturnMessageToRespondedByPhoneNumber,
        dummyGetReturnMessageToOtherResponderPhoneNumbers,
        () => null,
      )
    })

    describe('given alert state is STARTED', () => {
      beforeEach(() => {
        const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.STARTED,
          dummyGetClientMessageForRequestToReset(dummyLanguage), // the value of the message is arbitrary; the client message for request to reset is used here to show this
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
          dummyLanguage,
        )

        this.nextAlertState = stateTransition.nextAlertState
        this.incidentCategoryKey = stateTransition.incidentCategoryKey
        this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
        this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
      })

      it('should transition to WAITING_FOR_CATEGORY', () => {
        expect(this.nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
      })

      it('should not change the incident category', () => {
        expect(this.incidentCategoryKey).to.be.undefined
      })

      it('should give the return message to respondedByPhoneNumber for STARTED --> WAITING_FOR_CATEGORY', () => {
        expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
          dummyGetReturnMessageToRespondedByPhoneNumber(
            dummyLanguage,
            CHATBOT_STATE.STARTED,
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            dummyIncidentCategories,
          ),
        )
      })

      it('should give the return message to otherResponderPhoneNumbers for STARTED --> WAITING_FOR_CATEGORY', () => {
        expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
          dummyGetReturnMessageToOtherResponderPhoneNumbers(dummyLanguage, CHATBOT_STATE.STARTED, CHATBOT_STATE.WAITING_FOR_CATEGORY, undefined),
        )
      })
    })

    describe('given alert state is WAITING_FOR_REPLY', () => {
      beforeEach(() => {
        const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.WAITING_FOR_REPLY,
          dummyGetClientMessageForRequestToReset(dummyLanguage), // the value of the message is arbitrary; the client message for request to reset is used here to show this
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
          dummyLanguage,
        )

        this.nextAlertState = stateTransition.nextAlertState
        this.incidentCategoryKey = stateTransition.incidentCategoryKey
        this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
        this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
      })

      it('should transition to WAITING_FOR_CATEGORY', () => {
        expect(this.nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
      })

      it('should not change the incident category', () => {
        expect(this.incidentCategoryKey).to.be.undefined
      })

      it('should give the return message to respondedByPhoneNumber for WAITING_FOR_REPLY --> WAITING_FOR_CATEGORY', () => {
        expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
          dummyGetReturnMessageToRespondedByPhoneNumber(
            dummyLanguage,
            CHATBOT_STATE.WAITING_FOR_REPLY,
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            dummyIncidentCategories,
          ),
        )
      })

      it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_REPLY --> WAITING_FOR_CATEGORY', () => {
        expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
          dummyGetReturnMessageToOtherResponderPhoneNumbers(
            dummyLanguage,
            CHATBOT_STATE.WAITING_FOR_REPLY,
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            undefined,
          ),
        )
      })
    })

    describe('given alert state is WAITING_FOR_CATEGORY', () => {
      describe('and messageText contains a valid incident category', () => {
        beforeEach(() => {
          const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '   3   ',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
            dummyLanguage,
          )

          this.nextAlertState = stateTransition.nextAlertState
          this.incidentCategoryKey = stateTransition.incidentCategoryKey
          this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
          this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
        })

        it('should transition to COMPLETED', () => {
          expect(this.nextAlertState).to.equal(CHATBOT_STATE.COMPLETED)
        })

        it('should change the incident category to the trimmed message text', () => {
          expect(this.incidentCategoryKey).to.equal('3')
        })

        it('should give the return message to respondedByPhoneNumber for WAITING_FOR_CATEGORY --> COMPLETED', () => {
          expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
            dummyGetReturnMessageToRespondedByPhoneNumber(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.COMPLETED,
              dummyIncidentCategories,
            ),
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_CATEGORY --> COMPLETED', () => {
          expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
            dummyGetReturnMessageToOtherResponderPhoneNumbers(dummyLanguage, CHATBOT_STATE.WAITING_FOR_CATEGORY, CHATBOT_STATE.COMPLETED, 'Three'),
          )
        })
      })

      describe('and messageText does not contain a valid incident category (too low)', () => {
        beforeEach(() => {
          const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '   0   ',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
            dummyLanguage,
          )

          this.nextAlertState = stateTransition.nextAlertState
          this.incidentCategoryKey = stateTransition.incidentCategoryKey
          this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
          this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
        })

        it('should stay in WAITING_FOR_CATEGORY', () => {
          expect(this.nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
        })

        it('should not change the incident category', () => {
          expect(this.incidentCategoryKey).to.be.undefined
        })

        it('should give the return message to respondedByPhoneNumberfor WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
            dummyGetReturnMessageToRespondedByPhoneNumber(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              dummyIncidentCategories,
            ),
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
            dummyGetReturnMessageToOtherResponderPhoneNumbers(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              undefined,
            ),
          )
        })
      })

      describe('and messageText does not contain a valid incident category (too high)', () => {
        beforeEach(() => {
          const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '   5   ',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
            dummyLanguage,
          )

          this.nextAlertState = stateTransition.nextAlertState
          this.incidentCategoryKey = stateTransition.incidentCategoryKey
          this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
          this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
        })

        it('should stay in WAITING_FOR_CATEGORY', () => {
          expect(this.nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
        })

        it('should not change the incident category', () => {
          expect(this.incidentCategoryKey).to.be.undefined
        })

        it('should give the return message to respondedByPhoneNumberfor WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
            dummyGetReturnMessageToRespondedByPhoneNumber(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              dummyIncidentCategories,
            ),
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
            dummyGetReturnMessageToOtherResponderPhoneNumbers(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              undefined,
            ),
          )
        })
      })

      describe('and messageText does not contain a valid incident category (non-numeric)', () => {
        beforeEach(() => {
          const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '   A23   ',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
            dummyLanguage,
          )

          this.nextAlertState = stateTransition.nextAlertState
          this.incidentCategoryKey = stateTransition.incidentCategoryKey
          this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
          this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
        })

        it('should stay in WAITING_FOR_CATEGORY', () => {
          expect(this.nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
        })

        it('should not change the incident category', () => {
          expect(this.incidentCategoryKey).to.be.undefined
        })

        it('should give the return message to respondedByPhoneNumberfor WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
            dummyGetReturnMessageToRespondedByPhoneNumber(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              dummyIncidentCategories,
            ),
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
            dummyGetReturnMessageToOtherResponderPhoneNumbers(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              undefined,
            ),
          )
        })
      })
    })

    describe('given alert state is COMPLETED', () => {
      beforeEach(() => {
        const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.COMPLETED,
          'arbitrary',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
          dummyLanguage,
        )

        this.nextAlertState = stateTransition.nextAlertState
        this.incidentCategoryKey = stateTransition.incidentCategoryKey
        this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
        this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
      })

      it('should stay in COMPLETED', () => {
        expect(this.nextAlertState).to.equal(CHATBOT_STATE.COMPLETED)
      })

      it('should not change the incident category', () => {
        expect(this.incidentCategoryKey).to.be.undefined
      })

      it('should give the return message to respondedByPhoneNumber for COMPLETED --> COMPLETED', () => {
        expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
          dummyGetReturnMessageToRespondedByPhoneNumber(dummyLanguage, CHATBOT_STATE.COMPLETED, CHATBOT_STATE.COMPLETED, dummyIncidentCategories),
        )
      })

      it('should give the return message to otherResponderPhoneNumbers for COMPLETED --> COMPLETED', () => {
        expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
          dummyGetReturnMessageToOtherResponderPhoneNumbers(dummyLanguage, CHATBOT_STATE.COMPLETED, CHATBOT_STATE.COMPLETED, undefined),
        )
      })
    })

    describe('given alert state is RESET', () => {
      beforeEach(() => {
        const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.RESET,
          'arbitrary',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
          dummyLanguage,
        )

        this.nextAlertState = stateTransition.nextAlertState
        this.incidentCategoryKey = stateTransition.incidentCategoryKey
        this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
        this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
      })

      it('should stay in RESET', () => {
        expect(this.nextAlertState).to.equal(CHATBOT_STATE.RESET)
      })

      it('should not change the incident category', () => {
        expect(this.incidentCategoryKey).to.be.undefined
      })

      it('should give the return message to respondedByPhoneNumber for RESET --> RESET', () => {
        expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
          dummyGetReturnMessageToRespondedByPhoneNumber(dummyLanguage, CHATBOT_STATE.RESET, CHATBOT_STATE.RESET, dummyIncidentCategories),
        )
      })

      it('should give the return message to otherResponderPhoneNumbers for RESET --> RESET', () => {
        expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
          dummyGetReturnMessageToOtherResponderPhoneNumbers(dummyLanguage, CHATBOT_STATE.RESET, CHATBOT_STATE.RESET, undefined),
        )
      })
    })
  })

  describe('processStateTransitionWithMessage where getClientMessageForRequestToReset returns a string', () => {
    beforeEach(() => {
      this.alertStateMachine = new AlertStateMachine(
        dummyGetReturnMessageToRespondedByPhoneNumber,
        dummyGetReturnMessageToOtherResponderPhoneNumbers,
        dummyGetClientMessageForRequestToReset,
      )
    })

    describe('given alert state is STARTED', () => {
      describe('and messageText is not a request to reset', () => {
        beforeEach(() => {
          const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.STARTED,
            'ok',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
            dummyLanguage,
          )

          this.nextAlertState = stateTransition.nextAlertState
          this.incidentCategoryKey = stateTransition.incidentCategoryKey
          this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
          this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
        })

        it('should transition to WAITING_FOR_CATEGORY', () => {
          expect(this.nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
        })

        it('should not change the incident category', () => {
          expect(this.incidentCategoryKey).to.be.undefined
        })

        it('should give the return message to respondedByPhoneNumber for STARTED --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
            dummyGetReturnMessageToRespondedByPhoneNumber(
              dummyLanguage,
              CHATBOT_STATE.STARTED,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              dummyIncidentCategories,
            ),
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for STARTED --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
            dummyGetReturnMessageToOtherResponderPhoneNumbers(dummyLanguage, CHATBOT_STATE.STARTED, CHATBOT_STATE.WAITING_FOR_CATEGORY, undefined),
          )
        })
      })

      describe('and messageText is a request to reset', () => {
        beforeEach(() => {
          const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.STARTED,
            dummyGetClientMessageForRequestToReset(dummyLanguage),
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
            dummyLanguage,
          )

          this.nextAlertState = stateTransition.nextAlertState
          this.incidentCategoryKey = stateTransition.incidentCategoryKey
          this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
          this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
        })

        it('should transition to RESET', () => {
          expect(this.nextAlertState).to.equal(CHATBOT_STATE.RESET)
        })

        it('should not change the incident category', () => {
          expect(this.incidentCategoryKey).to.be.undefined
        })

        it('should give the return message to respondedByPhoneNumber for STARTED --> RESET', () => {
          expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
            dummyGetReturnMessageToRespondedByPhoneNumber(dummyLanguage, CHATBOT_STATE.STARTED, CHATBOT_STATE.RESET, dummyIncidentCategories),
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for STARTED --> RESET', () => {
          expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
            dummyGetReturnMessageToOtherResponderPhoneNumbers(dummyLanguage, CHATBOT_STATE.STARTED, CHATBOT_STATE.RESET, undefined),
          )
        })
      })
    })

    describe('given alert state is WAITING_FOR_REPLY', () => {
      describe('and messageText is not a request to reset', () => {
        beforeEach(() => {
          const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_REPLY,
            'ok',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
            dummyLanguage,
          )

          this.nextAlertState = stateTransition.nextAlertState
          this.incidentCategoryKey = stateTransition.incidentCategoryKey
          this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
          this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
        })

        it('should transition to WAITING_FOR_CATEGORY', () => {
          expect(this.nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
        })

        it('should not change the incident category', () => {
          expect(this.incidentCategoryKey).to.be.undefined
        })

        it('should give the return message to respondedByPhoneNumber for WAITING_FOR_REPLY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
            dummyGetReturnMessageToRespondedByPhoneNumber(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_REPLY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              dummyIncidentCategories,
            ),
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_REPLY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
            dummyGetReturnMessageToOtherResponderPhoneNumbers(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_REPLY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              undefined,
            ),
          )
        })
      })

      describe('and messageText is a request to reset', () => {
        beforeEach(() => {
          const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_REPLY,
            dummyGetClientMessageForRequestToReset(dummyLanguage),
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
            dummyLanguage,
          )

          this.nextAlertState = stateTransition.nextAlertState
          this.incidentCategoryKey = stateTransition.incidentCategoryKey
          this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
          this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
        })

        it('should transition to RESET', () => {
          expect(this.nextAlertState).to.equal(CHATBOT_STATE.RESET)
        })

        it('should not change the incident category', () => {
          expect(this.incidentCategoryKey).to.be.undefined
        })

        it('should give the return message to respondedByPhoneNumber for WAITING_FOR_REPLY --> RESET', () => {
          expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
            dummyGetReturnMessageToRespondedByPhoneNumber(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_REPLY,
              CHATBOT_STATE.RESET,
              dummyIncidentCategories,
            ),
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_REPLY --> RESET', () => {
          expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
            dummyGetReturnMessageToOtherResponderPhoneNumbers(dummyLanguage, CHATBOT_STATE.WAITING_FOR_REPLY, CHATBOT_STATE.RESET, undefined),
          )
        })
      })
    })

    describe('given alert state is WAITING_FOR_CATEGORY', () => {
      describe('and messageText contains a valid incident category', () => {
        beforeEach(() => {
          const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '   3   ',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
            dummyLanguage,
          )

          this.nextAlertState = stateTransition.nextAlertState
          this.incidentCategoryKey = stateTransition.incidentCategoryKey
          this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
          this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
        })

        it('should transition to COMPLETED', () => {
          expect(this.nextAlertState).to.equal(CHATBOT_STATE.COMPLETED)
        })

        it('should change the incident category to the trimmed message text', () => {
          expect(this.incidentCategoryKey).to.equal('3')
        })

        it('should give the return message to respondedByPhoneNumber for WAITING_FOR_CATEGORY --> COMPLETED', () => {
          expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
            dummyGetReturnMessageToRespondedByPhoneNumber(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.COMPLETED,
              dummyIncidentCategories,
            ),
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_CATEGORY --> COMPLETED', () => {
          expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
            dummyGetReturnMessageToOtherResponderPhoneNumbers(dummyLanguage, CHATBOT_STATE.WAITING_FOR_CATEGORY, CHATBOT_STATE.COMPLETED, 'Three'),
          )
        })
      })

      describe('and messageText does not contain a valid incident category (too low)', () => {
        beforeEach(() => {
          const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '   0   ',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
            dummyLanguage,
          )

          this.nextAlertState = stateTransition.nextAlertState
          this.incidentCategoryKey = stateTransition.incidentCategoryKey
          this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
          this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
        })

        it('should stay in WAITING_FOR_CATEGORY', () => {
          expect(this.nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
        })

        it('should not change the incident category', () => {
          expect(this.incidentCategoryKey).to.be.undefined
        })

        it('should give the return message to respondedByPhoneNumberfor WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
            dummyGetReturnMessageToRespondedByPhoneNumber(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              dummyIncidentCategories,
            ),
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
            dummyGetReturnMessageToOtherResponderPhoneNumbers(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              undefined,
            ),
          )
        })
      })

      describe('and messageText does not contain a valid incident category (too high)', () => {
        beforeEach(() => {
          const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '   5   ',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
            dummyLanguage,
          )

          this.nextAlertState = stateTransition.nextAlertState
          this.incidentCategoryKey = stateTransition.incidentCategoryKey
          this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
          this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
        })

        it('should stay in WAITING_FOR_CATEGORY', () => {
          expect(this.nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
        })

        it('should not change the incident category', () => {
          expect(this.incidentCategoryKey).to.be.undefined
        })

        it('should give the return message to respondedByPhoneNumberfor WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
            dummyGetReturnMessageToRespondedByPhoneNumber(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              dummyIncidentCategories,
            ),
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
            dummyGetReturnMessageToOtherResponderPhoneNumbers(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              undefined,
            ),
          )
        })
      })

      describe('and messageText does not contain a valid incident category (non-numeric)', () => {
        beforeEach(() => {
          const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '   A23   ',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
            dummyLanguage,
          )

          this.nextAlertState = stateTransition.nextAlertState
          this.incidentCategoryKey = stateTransition.incidentCategoryKey
          this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
          this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
        })

        it('should stay in WAITING_FOR_CATEGORY', () => {
          expect(this.nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
        })

        it('should not change the incident category', () => {
          expect(this.incidentCategoryKey).to.be.undefined
        })

        it('should give the return message to respondedByPhoneNumberfor WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
            dummyGetReturnMessageToRespondedByPhoneNumber(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              dummyIncidentCategories,
            ),
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
            dummyGetReturnMessageToOtherResponderPhoneNumbers(
              dummyLanguage,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              undefined,
            ),
          )
        })
      })
    })

    describe('given alert state is COMPLETED', () => {
      beforeEach(() => {
        const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.COMPLETED,
          'arbitrary',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
          dummyLanguage,
        )

        this.nextAlertState = stateTransition.nextAlertState
        this.incidentCategoryKey = stateTransition.incidentCategoryKey
        this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
        this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
      })

      it('should stay in COMPLETED', () => {
        expect(this.nextAlertState).to.equal(CHATBOT_STATE.COMPLETED)
      })

      it('should not change the incident category', () => {
        expect(this.incidentCategoryKey).to.be.undefined
      })

      it('should give the return message to respondedByPhoneNumber for COMPLETED --> COMPLETED', () => {
        expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
          dummyGetReturnMessageToRespondedByPhoneNumber(dummyLanguage, CHATBOT_STATE.COMPLETED, CHATBOT_STATE.COMPLETED, dummyIncidentCategories),
        )
      })

      it('should give the return message to otherResponderPhoneNumbers for COMPLETED --> COMPLETED', () => {
        expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
          dummyGetReturnMessageToOtherResponderPhoneNumbers(dummyLanguage, CHATBOT_STATE.COMPLETED, CHATBOT_STATE.COMPLETED, undefined),
        )
      })
    })

    describe('given alert state is RESET', () => {
      beforeEach(() => {
        const stateTransition = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.RESET,
          'arbitrary',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
          dummyLanguage,
        )

        this.nextAlertState = stateTransition.nextAlertState
        this.incidentCategoryKey = stateTransition.incidentCategoryKey
        this.returnMessageToRespondedByPhoneNumber = stateTransition.returnMessageToRespondedByPhoneNumber
        this.returnMessageToOtherResponderPhoneNumbers = stateTransition.returnMessageToOtherResponderPhoneNumbers
      })

      it('should stay in RESET', () => {
        expect(this.nextAlertState).to.equal(CHATBOT_STATE.RESET)
      })

      it('should not change the incident category', () => {
        expect(this.incidentCategoryKey).to.be.undefined
      })

      it('should give the return message to respondedByPhoneNumber for RESET --> RESET', () => {
        expect(this.returnMessageToRespondedByPhoneNumber).to.equal(
          dummyGetReturnMessageToRespondedByPhoneNumber(dummyLanguage, CHATBOT_STATE.RESET, CHATBOT_STATE.RESET, dummyIncidentCategories),
        )
      })

      it('should give the return message to otherResponderPhoneNumbers for RESET --> RESET', () => {
        expect(this.returnMessageToOtherResponderPhoneNumbers).to.equal(
          dummyGetReturnMessageToOtherResponderPhoneNumbers(dummyLanguage, CHATBOT_STATE.RESET, CHATBOT_STATE.RESET, undefined),
        )
      })
    })
  })
})
