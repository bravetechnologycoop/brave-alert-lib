// Third-party dependencies
const axios = require('axios')

// In-house dependencies
const helpers = require('./helpers')

// Middleware function to check for users logged into Brave's ClickUp
async function clickUpChecker(req, res, next) {
  const clickUpTeamName = helpers.getEnvVar('CLICKUP_TEAM_NAME')
  const clickUpTeamId = helpers.getEnvVar('CLICKUP_TEAM_ID')
  const clickupToken = req.body.clickupToken

  try {
    const clickupResponse = await axios.get('https://api.clickup.com/api/v2/team', {
      headers: {
        Authorization: clickupToken,
      },
    })

    const clickupMatches = clickupResponse.data.teams.filter(team => {
      return team.name === clickUpTeamName && team.id === clickUpTeamId
    })

    if (clickupMatches.length === 1) {
      return next()
    }

    helpers.log('ClickUp Team Name and ID are not accessible using this ClickUp Token')
    res.status(401).send({ message: 'Error in ClickUp Authentication' })
  } catch (err) {
    helpers.logError(err)
    res.status(401).send({ message: 'Error in ClickUp Authentication' })
  }
}

module.exports = {
  clickUpChecker,
}
