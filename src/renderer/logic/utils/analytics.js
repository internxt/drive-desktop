import ConfigStore from '../../../main/config-store'
const Analytics = require('analytics-node')
const analytics = new Analytics(process.env.APP_SEGMENT_KEY)

export default analytics
