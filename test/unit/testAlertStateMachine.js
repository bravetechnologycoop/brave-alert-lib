const expect = require('chai').expect
const { beforeEach, describe, it } = require('mocha')

const CHATBOT_STATE = require('../../lib/chatbotStateEnum')
const AlertStateMachine = require('../../lib/alertStateMachine')

function dummyGetReturnMessageToRespondedByPhoneNumber(fromAlertState, toAlertState, incidentCategories) {
  return `To RespondedByPhoneNumber: ${fromAlertState} --> ${toAlertState} with ${JSON.stringify(incidentCategories)}`
}

function dummyGetReturnMessageToOtherResponderPhoneNumbers(fromAlertState, toAlertState, selectedIncidentCategory) {
  return `To OtherResponderPhoneNumbers: ${fromAlertState} --> ${toAlertState} with "${selectedIncidentCategory}"`
}

const dummyIncidentCategoryKeys = ['1', '2', '3', '4']
const dummyIncidentCategories = ['One', 'Two', 'Three', 'Four']

describe('alertStateMachine.js unit tests:', () => {
  describe('constructor', () => {
    beforeEach(() => {
      this.alertStateMachine = new AlertStateMachine(
        () => 'to respondedByPhoneNumber',
        () => 'to others',
      )
    })

    it('should be able to call the getReturnMessageToRespondedByPhoneNumber function set in the constructor', () => {
      expect(this.alertStateMachine.getReturnMessageToRespondedByPhoneNumber()).to.equal('to respondedByPhoneNumber')
    })

    it('should be able to call the getReturnMessageToOtherResponderPhoneNumbers function set in the constructor', () => {
      expect(this.alertStateMachine.getReturnMessageToOtherResponderPhoneNumbers()).to.equal('to others')
    })
  })

  describe('processStateTransitionWithMessage', () => {
    beforeEach(() => {
      this.alertStateMachine = new AlertStateMachine(dummyGetReturnMessageToRespondedByPhoneNumber, dummyGetReturnMessageToOtherResponderPhoneNumbers)
    })

    describe('given alert state is STARTED', () => {
      it('should transition to WAITING_FOR_CATEGORY', () => {
        const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.STARTED,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
      })

      it('should not change the incident category', () => {
        const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.STARTED,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(incidentCategoryKey).to.be.undefined
      })

      it('should give the return message to respondedByPhoneNumber for STARTED --> WAITING_FOR_CATEGORY', () => {
        const { returnMessageToRespondedByPhoneNumber } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.STARTED,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(returnMessageToRespondedByPhoneNumber).to.equal(
          `To RespondedByPhoneNumber: ${CHATBOT_STATE.STARTED} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`,
        )
      })

      it('should give the return message to otherResponderPhoneNumbers for STARTED --> WAITING_FOR_CATEGORY', () => {
        const { returnMessageToOtherResponderPhoneNumbers } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.STARTED,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(returnMessageToOtherResponderPhoneNumbers).to.equal(
          `To OtherResponderPhoneNumbers: ${CHATBOT_STATE.STARTED} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with "undefined"`,
        )
      })
    })

    describe('given alert state is WAITING_FOR_REPLY', () => {
      it('should transition to WAITING_FOR_CATEGORY', () => {
        const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.WAITING_FOR_REPLY,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
      })

      it('should not change the incident category', () => {
        const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.WAITING_FOR_REPLY,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(incidentCategoryKey).to.be.undefined
      })

      it('should give the return message to respondedByPhoneNumber for WAITING_FOR_REPLY --> WAITING_FOR_CATEGORY', () => {
        const { returnMessageToRespondedByPhoneNumber } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.WAITING_FOR_REPLY,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(returnMessageToRespondedByPhoneNumber).to.equal(
          `To RespondedByPhoneNumber: ${CHATBOT_STATE.WAITING_FOR_REPLY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`,
        )
      })

      it('should give the return message  to otherResponderPhoneNumbers for WAITING_FOR_REPLY --> WAITING_FOR_CATEGORY', () => {
        const { returnMessageToOtherResponderPhoneNumbers } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.WAITING_FOR_REPLY,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(returnMessageToOtherResponderPhoneNumbers).to.equal(
          `To OtherResponderPhoneNumbers: ${CHATBOT_STATE.WAITING_FOR_REPLY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with "undefined"`,
        )
      })
    })

    describe('given alert state is WAITING_FOR_CATEGORY', () => {
      describe('and messageText contains a valid incident category', () => {
        it('should transition to COMPLETED', () => {
          const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(nextAlertState).to.equal(CHATBOT_STATE.COMPLETED)
        })

        it('should change the incident category to the message text for first valid key', () => {
          const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '1',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(incidentCategoryKey).to.equal('1')
        })

        it('should change the incident category to the message text for last valid key', () => {
          const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '4',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(incidentCategoryKey).to.equal('4')
        })

        it('should change the incident category to the trimmed message text', () => {
          const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '   2    ',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(incidentCategoryKey).to.equal('2')
        })

        it('should give the return message to respondedByPhoneNumber for WAITING_FOR_CATEGORY --> COMPLETED', () => {
          const { returnMessageToRespondedByPhoneNumber } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessageToRespondedByPhoneNumber).to.equal(
            `To RespondedByPhoneNumber: ${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.COMPLETED} with ["One","Two","Three","Four"]`,
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_CATEGORY --> COMPLETED', () => {
          const { returnMessageToOtherResponderPhoneNumbers } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessageToOtherResponderPhoneNumbers).to.equal(
            `To OtherResponderPhoneNumbers: ${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.COMPLETED} with "Three"`,
          )
        })
      })

      describe('and messageText does not contain a valid incident category (too low)', () => {
        it('should stay in WAITING_FOR_CATEGORY', () => {
          const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '0',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
        })

        it('should not change the incident category', () => {
          const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '0',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(incidentCategoryKey).to.be.undefined
        })

        it('should give the return message to respondedByPhoneNumberfor WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          const { returnMessageToRespondedByPhoneNumber } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '0',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessageToRespondedByPhoneNumber).to.equal(
            `To RespondedByPhoneNumber: ${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`,
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          const { returnMessageToOtherResponderPhoneNumbers } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '0',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessageToOtherResponderPhoneNumbers).to.equal(
            `To OtherResponderPhoneNumbers: ${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with "undefined"`,
          )
        })
      })

      describe('and messageText does not contain a valid incident category (too high)', () => {
        it('should stay in WAITING_FOR_CATEGORY', () => {
          const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '5',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
        })

        it('should not change the incident category', () => {
          const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '5',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(incidentCategoryKey).to.be.undefined
        })

        it('should give the return message to respondedByPhoneNumber for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          const { returnMessageToRespondedByPhoneNumber } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '5',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessageToRespondedByPhoneNumber).to.equal(
            `To RespondedByPhoneNumber: ${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`,
          )
        })

        it('should give the return message to otherResponderPhoneNumbersfor WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          const { returnMessageToOtherResponderPhoneNumbers } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '5',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessageToOtherResponderPhoneNumbers).to.equal(
            `To OtherResponderPhoneNumbers: ${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with "undefined"`,
          )
        })
      })

      describe('and messageText does not contain a valid incident category (non-numeric)', () => {
        it('should stay in WAITING_FOR_CATEGORY', () => {
          const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '2A3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_CATEGORY)
        })

        it('should not change the incident category', () => {
          const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '  2A3  ',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(incidentCategoryKey).to.be.undefined
        })

        it('should give the return message to respondedByPhoneNumber for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          const { returnMessageToRespondedByPhoneNumber } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '2A3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessageToRespondedByPhoneNumber).to.equal(
            `To RespondedByPhoneNumber: ${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`,
          )
        })

        it('should give the return message to otherResponderPhoneNumbers for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          const { returnMessageToOtherResponderPhoneNumbers } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '2A3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessageToOtherResponderPhoneNumbers).to.equal(
            `To OtherResponderPhoneNumbers: ${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with "undefined"`,
          )
        })
      })
    })

    describe('given alert state is COMPLETED', () => {
      it('should stay in COMPLETED', () => {
        const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.COMPLETED,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(nextAlertState).to.equal(CHATBOT_STATE.COMPLETED)
      })

      it('should not change the incident category', () => {
        const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.COMPLETED,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(incidentCategoryKey).to.be.undefined
      })

      it('should give the return message to respondedByPhoneNumber for COMPLETED --> COMPLETED', () => {
        const { returnMessageToRespondedByPhoneNumber } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.COMPLETED,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(returnMessageToRespondedByPhoneNumber).to.equal(
          `To RespondedByPhoneNumber: ${CHATBOT_STATE.COMPLETED} --> ${CHATBOT_STATE.COMPLETED} with ["One","Two","Three","Four"]`,
        )
      })

      it('should give the return message to otherResponderPhoneNumbers for COMPLETED --> COMPLETED', () => {
        const { returnMessageToOtherResponderPhoneNumbers } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.COMPLETED,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(returnMessageToOtherResponderPhoneNumbers).to.equal(
          `To OtherResponderPhoneNumbers: ${CHATBOT_STATE.COMPLETED} --> ${CHATBOT_STATE.COMPLETED} with "undefined"`,
        )
      })
    })
  })
})
