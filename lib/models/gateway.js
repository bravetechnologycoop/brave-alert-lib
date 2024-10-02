class Gateway {
    constructor(
        id,
        displayName,
        createdAt,
        updatedAt,
        sentVitalsAlertAt,
        isDisplayed,
        isSendingVitals,
        client,
    ) {
        this.id = id
        this.displayName = displayName
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        this.sentVitalsAlertAt = sentVitalsAlertAt
        this.isDisplayed = isDisplayed
        this.isSendingVitals = isSendingVitals
        this.client = client
    }
}

module.exports = Gateway