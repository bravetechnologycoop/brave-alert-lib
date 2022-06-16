const expect = require('chai').expect
const { beforeEach, describe, it } = require('mocha')

const CHATBOT_STATE = require('../../lib/chatbotStateEnum')
const AlertStateMachine = require('../../lib/alertStateMachine')

function dummyGetRetunMessages(fromAlertState, toAlertState, incidentCategories) {
  return `${fromAlertState} --> ${toAlertState} with ${JSON.stringify(incidentCategories)}`
}

const dummyIncidentCategoryKeys = ['1', '2', '3', '4']
const dummyIncidentCategories = ['One', 'Two', 'Three', 'Four']

describe('alertStateMachine.js unit tests:', () => {
  describe('constructor', () => {
    beforeEach(() => {
      this.alertStateMachine = new AlertStateMachine(() => 'my state')
    })

    it('should be able to call the getReturnMessage function set in the constructor', () => {
      expect(this.alertStateMachine.getReturnMessage()).to.equal('my state')
    })
  })

  describe('processStateTransitionWithMessage', () => {
    beforeEach(() => {
      this.alertStateMachine = new AlertStateMachine(dummyGetRetunMessages)
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

      it('should give the return message for STARTED --> WAITING_FOR_CATEGORY', () => {
        const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.STARTED,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(returnMessage).to.equal(`${CHATBOT_STATE.STARTED} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`)
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

      it('should give the return message for WAITING_FOR_REPLY --> WAITING_FOR_CATEGORY', () => {
        const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.WAITING_FOR_REPLY,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(returnMessage).to.equal(
          `${CHATBOT_STATE.WAITING_FOR_REPLY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`,
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

        it('should give the return message for WAITING_FOR_CATEGORY --> COMPLETED', () => {
          const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessage).to.equal(`${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.COMPLETED} with ["One","Two","Three","Four"]`)
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

        it('should give the return message for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '0',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessage).to.equal(
            `${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`,
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

        it('should give the return message for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '5',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessage).to.equal(
            `${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`,
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

        it('should give the return message for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
          const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_CATEGORY,
            '2A3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessage).to.equal(
            `${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`,
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

      it('should give the return message for COMPLETED --> COMPLETED', () => {
        const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
          CHATBOT_STATE.COMPLETED,
          '3',
          dummyIncidentCategoryKeys,
          dummyIncidentCategories,
        )

        expect(returnMessage).to.equal(`${CHATBOT_STATE.COMPLETED} --> ${CHATBOT_STATE.COMPLETED} with ["One","Two","Three","Four"]`)
      })
    })
  })
})
