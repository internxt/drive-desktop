const state = {
  settingsDialog: null
}

const mutations = {
  SET_SETTINGS_DIALOG (state, dialog) {
    state.settingsDialog = dialog
  },
  UNSET_SETTINGS_DIALOG(state) {
    state.settingsDialog = null
  }
}

const actions = {
  showSettingsDialog ({ commit }, dialog) {
    commit(mutations.SET_SETTINGS_DIALOG.name, dialog)
  },
  hideSettingsDialog({commit}) {
    commit(mutations.UNSET_SETTINGS_DIALOG.name)
  }
}

export default {
  state,
  mutations,
  actions
}
