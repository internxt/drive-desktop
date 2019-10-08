export default function () {
  return Promise.all([
    require('./models/file'),
    require('./models/folder'),
    require('./models/meta')
  ].map((o) => o.sync({
    force: true
  }))).then(function () {
    console.log('loaded models')
  }).catch(function (err) {
    console.log('Error loading models', err)
  })
}
