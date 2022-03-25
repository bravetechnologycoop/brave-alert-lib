const expect = require('chai').expect
const { beforeEach, describe, it } = require('mocha')

const CHATBOT_STATE = require('../../lib/chatbotStateEnum')
const AlertStateMachine = require('../../lib/alertStateMachine')

function dummyGetRetunMessages(fromAlertState, toAlertState, incidentCategories, deviceName) {
  return `${fromAlertState} --> ${toAlertState} with ${JSON.stringify(incidentCategories)} and "${deviceName}"`
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

        it('should not change the details', () => {
          const { details } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.STARTED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(details).to.be.undefined
        })

        it('should not change the device name', () => {
          const { deviceName } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.STARTED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(deviceName).to.be.undefined
        })

        it('should give the return message for STARTED --> WAITING_FOR_CATEGORY', () => {
          const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.STARTED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessage).to.equal(
            `${CHATBOT_STATE.STARTED} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"] and "undefined"`,
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

        it('should not change the details', () => {
          const { details } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_REPLY,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(details).to.be.undefined
        })

        it('should not change the device name', () => {
          const { deviceName } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_REPLY,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(deviceName).to.be.undefined
        })

        it('should give the return message for WAITING_FOR_REPLY --> WAITING_FOR_CATEGORY', () => {
          const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_REPLY,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessage).to.equal(
            `${CHATBOT_STATE.WAITING_FOR_REPLY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"] and "undefined"`,
          )
        })
      })

      describe('given alert state is WAITING_FOR_CATEGORY', () => {
        describe('and messageText contains a valid incident category', () => {
          it('should transition to WAITING_FOR_DETAILS', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              '3',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(CHATBOT_STATE.WAITING_FOR_DETAILS)
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

          it('should not change the details', () => {
            const { details } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              '3',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(details).to.be.undefined
          })

          it('should not change the device name', () => {
            const { deviceName } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              '3',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(deviceName).to.be.undefined
          })

          it('should give the return message for WAITING_FOR_CATEGORY --> WAITING_FOR_DETAILS', () => {
            const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              '3',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(returnMessage).to.equal(
              `${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.WAITING_FOR_DETAILS} with ["One","Two","Three","Four"] and "undefined"`,
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

          it('should not change the details', () => {
            const { details } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              '0',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(details).to.be.undefined
          })

          it('should not change the device name', () => {
            const { deviceName } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              '0',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(deviceName).to.be.undefined
          })

          it('should give the return message for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
            const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              '0',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(returnMessage).to.equal(
              `${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"] and "undefined"`,
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

          it('should not change the details', () => {
            const { details } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              '5',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(details).to.be.undefined
          })

          it('should not change the device name', () => {
            const { deviceName } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              '5',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(deviceName).to.be.undefined
          })

          it('should give the return message for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
            const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              '5',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(returnMessage).to.equal(
              `${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"] and "undefined"`,
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

          it('should not change the details', () => {
            const { details } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              '2A3',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(details).to.be.undefined
          })

          it('should not change the device name', () => {
            const { deviceName } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              '2A3',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(deviceName).to.be.undefined
          })

          it('should give the return message for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', () => {
            const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.WAITING_FOR_CATEGORY,
              '2A3',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(returnMessage).to.equal(
              `${CHATBOT_STATE.WAITING_FOR_CATEGORY} --> ${CHATBOT_STATE.WAITING_FOR_CATEGORY} with ["One","Two","Three","Four"] and "undefined"`,
            )
          })
        })
      })

      describe('given alert state is WAITING_FOR_DETAILS', () => {
        it('should transition to COMPLETED', () => {
          const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_DETAILS,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(nextAlertState).to.equal(CHATBOT_STATE.COMPLETED)
        })

        it('should not change the incident category', () => {
          const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_DETAILS,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(incidentCategoryKey).to.be.undefined
        })

        it('should change the details to the message text', () => {
          const { details } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_DETAILS,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(details).to.equal('3')
        })

        it('should change the details to the trimmed message text', () => {
          const { details } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_DETAILS,
            '    many    details    ',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(details).to.equal('many    details')
        })

        it('should not change the device name', () => {
          const { deviceName } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_DETAILS,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(deviceName).to.be.undefined
        })

        it('should give the return message for WAITING_FOR_DETAILS --> COMPLETED', () => {
          const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.WAITING_FOR_DETAILS,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessage).to.equal(
            `${CHATBOT_STATE.WAITING_FOR_DETAILS} --> ${CHATBOT_STATE.COMPLETED} with ["One","Two","Three","Four"] and "undefined"`,
          )
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

        it('should not change the details', () => {
          const { details } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.COMPLETED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(details).to.be.undefined
        })

        it('should not change the device name', () => {
          const { deviceName } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.COMPLETED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(deviceName).to.be.undefined
        })

        it('should give the return message for COMPLETED --> COMPLETED', () => {
          const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
            CHATBOT_STATE.COMPLETED,
            '3',
            dummyIncidentCategoryKeys,
            dummyIncidentCategories,
          )

          expect(returnMessage).to.equal(
            `${CHATBOT_STATE.COMPLETED} --> ${CHATBOT_STATE.COMPLETED} with ["One","Two","Three","Four"] and "undefined"`,
          )
        })
      })

      describe('given alert state is NAMING_STARTED', () => {
        describe('and messageText contains a valid new name', () => {
          it('should transition to NAMING_COMPLETED', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              'A',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(CHATBOT_STATE.NAMING_COMPLETED)
          })

          it('should not change the incident category', () => {
            const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              'A',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(incidentCategoryKey).to.be.undefined
          })

          it('should not change the details', () => {
            const { details } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              'A',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(details).to.be.undefined
          })

          it('should change the device name', () => {
            const { deviceName } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              'A',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(deviceName).to.equal('A')
          })

          it('should change the device name to its trimmed value', () => {
            const { deviceName } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '   Abc%*   ',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(deviceName).to.equal('Abc%*')
          })

          it('should give the return message for NAMING_STARTED --> NAMING_COMPLETED', () => {
            const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              'A',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(returnMessage).to.equal(
              `${CHATBOT_STATE.NAMING_STARTED} --> ${CHATBOT_STATE.NAMING_COMPLETED} with ["One","Two","Three","Four"] and "A"`,
            )
          })
        })

        describe('and messageText does not contain a valid incident category (empty)', () => {
          it('should stay in NAMING_STARTED', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(CHATBOT_STATE.NAMING_STARTED)
          })

          it('should stay in NAMING_STARTED if trims to empty', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '     ',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(CHATBOT_STATE.NAMING_STARTED)
          })

          it('should not change the incident category', () => {
            const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(incidentCategoryKey).to.be.undefined
          })

          it('should not change the details', () => {
            const { details } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(details).to.be.undefined
          })

          it('should not change the device name', () => {
            const { deviceName } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(deviceName).to.be.undefined
          })

          it('should give the return message for NAMING_STARTED --> NAMING_STARTED', () => {
            const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(returnMessage).to.equal(
              `${CHATBOT_STATE.NAMING_STARTED} --> ${CHATBOT_STATE.NAMING_STARTED} with ["One","Two","Three","Four"] and "undefined"`,
            )
          })
        })

        describe('and messageText does not contain a valid incident category (_NEW)', () => {
          it('should stay in NAMING_STARTED', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '_NEW',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(CHATBOT_STATE.NAMING_STARTED)
          })

          it('should stay in NAMING_STARTED if trims to _NEW', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '    _NEW   ',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(CHATBOT_STATE.NAMING_STARTED)
          })

          it('should stay in NAMING_STARTED if upper cases to _NEW', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '_nEw',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(CHATBOT_STATE.NAMING_STARTED)
          })

          it('should not change the incident category', () => {
            const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '_NEW',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(incidentCategoryKey).to.be.undefined
          })

          it('should not change the details', () => {
            const { details } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '_NEW',
              '',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(details).to.be.undefined
          })

          it('should not change the device name', () => {
            const { deviceName } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '_NEW',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(deviceName).to.be.undefined
          })

          it('should give the return message for NAMING_STARTED --> NAMING_STARTED', () => {
            const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '_NEW',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(returnMessage).to.equal(
              `${CHATBOT_STATE.NAMING_STARTED} --> ${CHATBOT_STATE.NAMING_STARTED} with ["One","Two","Three","Four"] and "undefined"`,
            )
          })
        })

        describe('and messageText contains "Later"', () => {
          it('should transition to NAMING_POSTPONED', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              'Later',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(CHATBOT_STATE.NAMING_POSTPONED)
          })

          it('(trimmed) should transition to NAMING_POSTPONED', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              '    Later  ',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(CHATBOT_STATE.NAMING_POSTPONED)
          })

          it('(capitalized) should transition to NAMING_POSTPONED', () => {
            const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              'LaTeR',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(nextAlertState).to.equal(CHATBOT_STATE.NAMING_POSTPONED)
          })

          it('should not change the incident category', () => {
            const { incidentCategoryKey } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              'Later',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(incidentCategoryKey).to.be.undefined
          })

          it('should not change the details', () => {
            const { details } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              'Later',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(details).to.be.undefined
          })

          it('should not change the device name', () => {
            const { deviceName } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              'Later',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(deviceName).to.be.undefined
          })

          it('should give the return message for NAMING_STARTED --> NAMING_POSTPONED', () => {
            const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(
              CHATBOT_STATE.NAMING_STARTED,
              'Later',
              dummyIncidentCategoryKeys,
              dummyIncidentCategories,
            )

            expect(returnMessage).to.equal(
              `${CHATBOT_STATE.NAMING_STARTED} --> ${CHATBOT_STATE.NAMING_POSTPONED} with ["One","Two","Three","Four"] and "undefined"`,
            )
          })
        })
      })
    })
  })
})
