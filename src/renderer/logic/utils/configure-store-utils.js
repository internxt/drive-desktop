import ConfigStore from '../../../main/config-store'

export default function clearConfigStore() {
  ConfigStore.set('user.email', undefined)
  ConfigStore.set('user.uuid', undefined)
}
