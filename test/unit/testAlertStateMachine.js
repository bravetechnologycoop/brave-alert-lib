const expect = require('chai').expect
const { beforeEach, describe, it } = require('mocha')

const ALERT_STATE = require('../../lib/alertStateEnum')
const AlertStateMachine = require('../../lib/alertStateMachine')

function dummyGetRetunMessages(fromAlertState, toAlertState, incidentCategories) {
  return `${fromAlertState} --> ${toAlertState} with ${JSON.stringify(incidentCategories)}`
}

const dummyIncidentCategoryKeys = ['1', '2', '3', '4']
const dummyIncidentCategories = ['One', 'Two', 'Three', 'Four']

describe('alertStateMachine.js unit tests:', () => {
  describe('constructor', () => {
    beforeEach(() => {
      this.alertStateMachine = new AlertStateMachine(true, () => 'my state')
    })

    it('should be able to call the getReturnMessage function set in the constructor', () => {
      expect(this.alertStateMachine.getReturnMessage()).to.equal('my state')
    })

    it('should initialize asksIncidentDetails', () => {
      expect(this.alertStateMachine.asksIncidentDetails).to.be.true
    })
  })

  describe('processStateTransitionWithMessage', () => {
    describe('if asks for incident details', () => {
      beforeEach(() => {
        this.alertStateMachine = new AlertStateMachine(true, dummyGetRetunMessages)
      })

      describe('given alert state is STARTED', () => {
        it('should transition to WAITING_FOR_CATEGORY', () => {
          const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.STARTED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(nextAlertState).to.equal(ALERT_STATE.WAITING_FOR_CATEGORY)
        })

        it('should not change the incident category', () => {
          const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.STARTED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(incidentCategoryKey).to.be.undefined
        })

        it('should not change the details', () => {
          const { details } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.STARTED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(details).to.be.undefined
        })

        it('should give the return message for STARTED --> WAITING_FOR_CATEGORY', () => {
          const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.STARTED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessage).to.equal(`${ALERT_STATE.STARTED} --> ${ALERT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`)
        })
      })

      describe('given alert state is WAITING_FOR_REPLY', () => {
        it('should transition to WAITING_FOR_CATEGORY', () => {
          const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.WAITING_FOR_REPLY,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(nextAlertState).to.equal(ALERT_STATE.WAITING_FOR_CATEGORY)
        })

        it('should not change the incident category', () => {
          const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.WAITING_FOR_REPLY,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(incidentCategoryKey).to.be.undefined
        })

        it('should not change the details', () => {
          const { details } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.WAITING_FOR_REPLY,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(details).to.be.undefined
        })

        it('should give the return message for WAITING_FOR_REPLY --> WAITING_FOR_CATEGORY', () => {
          const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.WAITING_FOR_REPLY,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessage).to.equal(`${ALERT_STATE.WAITING_FOR_REPLY} --> ${ALERT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`)
        })
      })

      describe('given alert state is WAITING_FOR_CATEGORY', () => {
        describe('and messageText contains a valid incident category', () => {
          it('should transition to WAITING_FOR_DETAILS', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '3',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(ALERT_STATE.WAITING_FOR_DETAILS)
          })

          it('should change the incident category to the message text for first valid key', () => {
            const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '1',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(incidentCategoryKey).to.equal('1')
          })

          it('should change the incident category to the message text for last valid key', () => {
            const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '4',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(incidentCategoryKey).to.equal('4')
          })

          it('should change the incident category to the trimmed message text', () => {
            const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '   2    ',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(incidentCategoryKey).to.equal('2')
          })

          it('should not change the details', () => {
            const { details } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '3',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(details).to.be.undefined
          })

          it('should give the return message for WAITING_FOR_CATEGORY --> WAITING_FOR_DETAILS', () => {
            const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '3',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(returnMessage).to.equal(
              `${ALERT_STATE.WAITING_FOR_CATEGORY} --> ${ALERT_STATE.WAITING_FOR_DETAILS} with ["One","Two","Three","Four"]`,
            )
          })
        })

        describe('and messageText does not contain a valid incident category (too low)', () => {
          it('should stay in WAITING_FOR_CATEGORY', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '0',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(ALERT_STATE.WAITING_FOR_CATEGORY)
          })

          it('should not change the incident category', () => {
            const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '0',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(incidentCategoryKey).to.be.undefined
          })

          it('should not change the details', () => {
            const { details } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '0',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(details).to.be.undefined
          })

          it('should give the return message for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
            const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '0',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(returnMessage).to.equal(
              `${ALERT_STATE.WAITING_FOR_CATEGORY} --> ${ALERT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`,
            )
          })
        })

        describe('and messageText does not contain a valid incident category (too high)', () => {
          it('should stay in WAITING_FOR_CATEGORY', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '5',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(ALERT_STATE.WAITING_FOR_CATEGORY)
          })

          it('should not change the incident category', () => {
            const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '5',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(incidentCategoryKey).to.be.undefined
          })

          it('should not change the details', () => {
            const { details } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '5',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(details).to.be.undefined
          })

          it('should give the return message for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
            const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '5',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(returnMessage).to.equal(
              `${ALERT_STATE.WAITING_FOR_CATEGORY} --> ${ALERT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`,
            )
          })
        })

        describe('and messageText does not contain a valid incident category (non-numeric)', () => {
          it('should stay in WAITING_FOR_CATEGORY', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '2A3',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(ALERT_STATE.WAITING_FOR_CATEGORY)
          })

          it('should not change the incident category', () => {
            const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '  2A3  ',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(incidentCategoryKey).to.be.undefined
          })

          it('should not change the details', () => {
            const { details } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '2A3',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(details).to.be.undefined
          })

          it('should give the return message for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
            const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
              ALERT_STATE.WAITING_FOR_CATEGORY,
              '2A3',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(returnMessage).to.equal(
              `${ALERT_STATE.WAITING_FOR_CATEGORY} --> ${ALERT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"]`,
            )
          })
        })
      })

      describe('given alert state is WAITING_FOR_DETAILS', () => {
        it('should transition to COMPLETED', () => {
          const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.WAITING_FOR_DETAILS,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(nextAlertState).to.equal(ALERT_STATE.COMPLETED)
        })

        it('should not change the incident category', () => {
          const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.WAITING_FOR_DETAILS,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(incidentCategoryKey).to.be.undefined
        })

        it('should change the details to the message text', () => {
          const { details } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.WAITING_FOR_DETAILS,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(details).to.equal('3')
        })

        it('should change the details to the trimmed message text', () => {
          const { details } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.WAITING_FOR_DETAILS,
            '    many    details    ',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(details).to.equal('many    details')
        })

        it('should give the return message for WAITING_FOR_DETAILS --> COMPLETED', () => {
          const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.WAITING_FOR_DETAILS,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessage).to.equal(`${ALERT_STATE.WAITING_FOR_DETAILS} --> ${ALERT_STATE.COMPLETED} with ["One","Two","Three","Four"]`)
        })
      })

      describe('given alert state is COMPLETED', () => {
        it('should stay in COMPLETED', () => {
          const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.COMPLETED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(nextAlertState).to.equal(ALERT_STATE.COMPLETED)
        })

        it('should not change the incident category', () => {
          const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.COMPLETED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(incidentCategoryKey).to.be.undefined
        })

        it('should not change the details', () => {
          const { details } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.COMPLETED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(details).to.be.undefined
        })

        it('should give the return message for COMPLETED --> COMPLETED', () => {
          const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
            ALERT_STATE.COMPLETED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessage).to.equal(`${ALERT_STATE.COMPLETED} --> ${ALERT_STATE.COMPLETED} with ["One","Two","Three","Four"]`)
        })
      })
    })
  })
})
