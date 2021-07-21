/*
* A state is defined by a name and two parameters,
* play button state and stop button state
*/

function setState(syncState, playButtonState, stopButtonState) {
  return {syncState, playButtonState, stopButtonState}
}

function defaultState(transition) {
  let newState = setState('default', 'active', 'inactive')
  switch (transition) {
    case 'pending':
      newState = setState('pending', 'loading', 'active')
      break
    case 'block':
      newState = setState('block', 'inactive', 'inactive')
      break
  }
  return newState
}

function pendingState(transition) {
  let newState = setState('pending', 'loading', 'active')
  switch (transition) {
    case 'success':
      newState = setState('complete', 'active', 'inactive')
      break
    case 'error':
    case 'stop':
      newState = setState('stop', 'active', 'inactive')
      break
  }
  return newState
}

function completeState(transition) {
  let newState = setState('complete', 'active', 'inactive')
  switch (transition) {
    case 'pending':
      newState = setState('pending', 'loading', 'active')
      break
    case 'block':
      newState = setState('block', 'inactive', 'inactive')
      break
  }
  return newState
}

function stopState(transition) {
  let newState = setState('stop', 'active', 'inactive')
  switch (transition) {
    case 'pending':
      newState = setState('pending', 'loading', 'active')
      break
      /*
    case 'block':
      newState = setState('block', 'inactive', 'inactive')
      break
      */
    case 'unblock':
      newState = setState('default', 'active', 'inactive')
  }
  return newState
}

function blockState(transition) {
  let newState = setState('block', 'inactive', 'inactive')
  switch (transition) {
    case 'pending':
      newState = setState('pending', 'loading', 'active')
      break
    case 'default':
      newState = setState('default', 'active', 'inactive')
  }
  return newState
}

function syncButtonState(currentState, transition) {
  let newState = null
  switch (currentState) {
    case 'default':
      newState = defaultState(transition)
      break
    case 'pending':
      newState = pendingState(transition)
      break
    case 'complete':
      newState = completeState(transition)
      break
    case 'stop':
      newState = stopState(transition)
      break
    case 'block':
      newState = blockState(transition)
      break
    default:
  }
  return newState
}

module.exports = syncButtonState
