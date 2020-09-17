const expect = require('chai').expect
const { beforeEach, describe, it } = require('mocha')

const ALERT_STATE = require('./../../lib/alertStateEnum.js')
const AlertStateMachine = require('../../lib/alertStateMachine.js')

function dummyGetRetunMessages(fromAlertState, toAlertState) {
    return `${fromAlertState} --> ${toAlertState}`
}

const dummyIncidentCategories = {
    '1': 'One',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four'
}

describe('alertStateMachine.js unit tests:', function() {
    describe('constructor', function() {
        beforeEach(function() {
            this.alertStateMachine = new AlertStateMachine(
                true,
                () => { return 'my state' },
            )
        })

        it('should be able to call the getReturnMessage function set in the constructor', function() {
            expect(this.alertStateMachine.getReturnMessage()).to.equal('my state')
        })

        it('should initialize asksIncidentDetails', function() {
            expect(this.alertStateMachine.asksIncidentDetails).to.be.true
        })
    })

    describe('processStateTransitionWithMessage', function() {
        describe('if asks for incident details', function() {
            beforeEach(function() {
                this.alertStateMachine = new AlertStateMachine(
                    true,
                    dummyGetRetunMessages,
                )
            })

            describe('given alert state is STARTED', function() {
                it('should transition to WAITING_FOR_CATEGORY', function () {
                    const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.STARTED, '3', dummyIncidentCategories)

                    expect(nextAlertState).to.equal(ALERT_STATE.WAITING_FOR_CATEGORY)
                })

                it('should not change the incident category', function() {
                    const { incidentCategory } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.STARTED, '3', dummyIncidentCategories)

                    expect(incidentCategory).to.be.undefined
                })

                it('should not change the details', function() {
                    const { details } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.STARTED, '3', dummyIncidentCategories)

                    expect(details).to.be.undefined
                })

                it('should give the return message for STARTED --> WAITING_FOR_CATEGORY', function() {
                    const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.STARTED, '3', dummyIncidentCategories)

                    expect(returnMessage).to.equal(`${ALERT_STATE.STARTED} --> ${ALERT_STATE.WAITING_FOR_CATEGORY}`)
                })
            })

            describe('given alert state is WAITING_FOR_REPLY', function() {
                it('should transition to WAITING_FOR_CATEGORY', function () {
                    const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_REPLY, '3', dummyIncidentCategories)

                    expect(nextAlertState).to.equal(ALERT_STATE.WAITING_FOR_CATEGORY)
                })

                it('should not change the incident category', function() {
                    const { incidentCategory } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_REPLY, '3', dummyIncidentCategories)

                    expect(incidentCategory).to.be.undefined
                })

                it('should not change the details', function() {
                    const { details } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_REPLY, '3', dummyIncidentCategories)

                    expect(details).to.be.undefined
                })

                it('should give the return message for WAITING_FOR_REPLY --> WAITING_FOR_CATEGORY', function() {
                    const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_REPLY, '3', dummyIncidentCategories)

                    expect(returnMessage).to.equal(`${ALERT_STATE.WAITING_FOR_REPLY} --> ${ALERT_STATE.WAITING_FOR_CATEGORY}`)
                })
            })

            describe('given alert state is WAITING_FOR_CATEGORY', function() {
                describe('and messageText contains a valid incident category', function () {
                    it('should transition to WAITING_FOR_DETAILS', function () {
                        const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_CATEGORY, '3', dummyIncidentCategories)
    
                        expect(nextAlertState).to.equal(ALERT_STATE.WAITING_FOR_DETAILS)
                    })
    
                    it('should change the incident category to the message text', function() {
                        const { incidentCategory } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_CATEGORY, '3', dummyIncidentCategories)
    
                        expect(incidentCategory).to.equal('3')
                    })

                    it('should change the incident category to the trimmed message text', function() {
                        const { incidentCategory } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_CATEGORY, '   2    ', dummyIncidentCategories)
    
                        expect(incidentCategory).to.equal('2')
                    })
    
                    it('should not change the details', function() {
                        const { details } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_CATEGORY, '3', dummyIncidentCategories)
    
                        expect(details).to.be.undefined
                    })
    
                    it('should give the return message for WAITING_FOR_CATEGORY --> WAITING_FOR_DETAILS', function() {
                        const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_CATEGORY, '3', dummyIncidentCategories)
    
                        expect(returnMessage).to.equal(`${ALERT_STATE.WAITING_FOR_CATEGORY} --> ${ALERT_STATE.WAITING_FOR_DETAILS}`)
                    })
                })

                describe('and messageText does not contain a valid incident category', function() {
                    it('should stay in WAITING_FOR_CATEGORY', function () {
                        const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_CATEGORY, '5', dummyIncidentCategories)
    
                        expect(nextAlertState).to.equal(ALERT_STATE.WAITING_FOR_CATEGORY)
                    })
    
                    it('should not change the incident category', function() {
                        const { incidentCategory } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_CATEGORY, '  2A3  ', dummyIncidentCategories)
    
                        expect(incidentCategory).to.be.undefined
                    })
    
                    it('should not change the details', function() {
                        const { details } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_CATEGORY, '5', dummyIncidentCategories)
    
                        expect(details).to.be.undefined
                    })
    
                    it('should give the return message for WAITING_FOR_CATEGORY --> WAITING_FOR_CATEGORY', function() {
                        const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_CATEGORY, '5', dummyIncidentCategories)
    
                        expect(returnMessage).to.equal(`${ALERT_STATE.WAITING_FOR_CATEGORY} --> ${ALERT_STATE.WAITING_FOR_CATEGORY}`)
                    })
                })
            })

            describe('given alert state is WAITING_FOR_DETAILS', function() {
                it('should transition to COMPLETED', function () {
                    const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_DETAILS, '3', dummyIncidentCategories)

                    expect(nextAlertState).to.equal(ALERT_STATE.COMPLETED)
                })

                it('should not change the incident category', function() {
                    const { incidentCategory } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_DETAILS, '3', dummyIncidentCategories)

                    expect(incidentCategory).to.be.undefined
                })

                it('should change the details to the message text', function() {
                    const { details } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_DETAILS, '3', dummyIncidentCategories)

                    expect(details).to.equal('3')
                })

                it('should change the details to the trimmed message text', function() {
                    const { details } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_DETAILS, '    many    details    ', dummyIncidentCategories)

                    expect(details).to.equal('many    details')
                })

                it('should give the return message for WAITING_FOR_DETAILS --> COMPLETED', function() {
                    const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.WAITING_FOR_DETAILS, '3', dummyIncidentCategories)

                    expect(returnMessage).to.equal(`${ALERT_STATE.WAITING_FOR_DETAILS} --> ${ALERT_STATE.COMPLETED}`)
                })
            })

            describe('given alert state is COMPLETED', function() {
                it('should stay in COMPLETED', function () {
                    const { nextAlertState } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.COMPLETED, '3', dummyIncidentCategories)

                    expect(nextAlertState).to.equal(ALERT_STATE.COMPLETED)
                })

                it('should not change the incident category', function() {
                    const { incidentCategory } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.COMPLETED, '3', dummyIncidentCategories)

                    expect(incidentCategory).to.be.undefined
                })

                it('should not change the details', function() {
                    const { details } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.COMPLETED, '3', dummyIncidentCategories)

                    expect(details).to.be.undefined
                })

                it('should give the return message for COMPLETED --> COMPLETED', function() {
                    const { returnMessage } = this.alertStateMachine.processStateTransitionWithMessage(ALERT_STATE.COMPLETED, '3', dummyIncidentCategories)

                    expect(returnMessage).to.equal(`${ALERT_STATE.COMPLETED} --> ${ALERT_STATE.COMPLETED}`)
                })
            })
        })
    })
})