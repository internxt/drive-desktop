<template>
  <div @click.stop="backupSelected = null">
    <p class="text-sm">Folders you want to add to the next backup</p>
    <div
      class="
        h-44
        mt-3
        border border-gray-200
        bg-white
        rounded-md
        overflow-y-auto
      "
    >
      <div
        v-for="(backup, i) in enabledBackups"
        :key="backup.id"
        :class="{
          'bg-gray-50': i % 2 != 0 && backupSelected != backup,
          'bg-blue-600 text-white': backupSelected === backup
        }"
        class="flex items-center justify-between px-2 py-1 max-w-full"
        @click.stop="backupSelected = backup"
        @dblclick="() => openParentFolder(backup.path)"
      >
        <div class="flex items-center overflow-hidden">
          <img
            :src="FolderIcon"
            style="margin-right: 6px"
            class="flex-shrink-0 w-4 h-4"
          />
          <p class="truncate">{{ basename(backup.path) }}</p>
        </div>
        <BackupsError
          :error="findErrorForBackup(backup.id)"
          @actionClick="
            action =>
              action === 'FIND_FOLDER'
                ? findFolder(backup)
                : startBackupProcess()
          "
        />
      </div>
      <content-placeholders v-if="loading" :rounded="true" class="mt-2 ml-2">
        <content-placeholders-text v-for="i in 4" :lines="1" :key="i" />
      </content-placeholders>
    </div>
    <div class="flex items-center justify-between mt-3">
      <div class="flex items-center space-x-1">
        <Button @click="selectFolder">
          <div class="flex items-center">
            <UilPlus class="inline" size="18px" />
          </div>
        </Button>
        <Button
          @click="disableBackup"
          :state="backupSelected ? 'default' : 'default-disabled'"
        >
          <div class="flex items-center">
            <UilMinus class="inline" size="18px" />
          </div>
        </Button>
      </div>
      <div class="flex items-center space-x-1">
        <Button @click="$emit('close')">Cancel</Button>
        <Button
          :state="thereIsSomethingToSave ? 'accent' : 'accent-disabled'"
          @click="save"
          >Save</Button
        >
      </div>
    </div>
  </div>
</template>

<script>
import {
  UilFolder,
  UilPlus,
  UilTrashAlt,
  UilMinus
} from '@iconscout/vue-unicons'
import {
  getAllBackups,
  createBackup,
  updateBackup,
  updateBackupPath,
  deleteBackup
} from '../../../backup-process/service'
import Button from '../Button/Button.vue'
import fs from 'fs'
import path from 'path'
import electron, { ipcRenderer } from 'electron'
import BackupsError from './BackupError.vue'
import FolderIcon from '../../assets/icons/apple/folder.svg'
const remote = require('@electron/remote')

export default {
  components: {
    UilFolder,
    Button,
    UilPlus,
    UilTrashAlt,
    BackupsError,
    UilMinus
  },
  props: ['backupsBucket', 'errors'],
  data() {
    return {
      backups: [],
      backupsToCreate: [],
      backupsToDisable: [],
      backupsToEnable: [],
      backupSelected: null,
      loading: false,
      FolderIcon
    }
  },
  mounted() {
    this.getAllBackups()
  },
  methods: {
    async getAllBackups() {
      this.loading = true
      this.backups = await getAllBackups()
      this.loading = false
    },
    selectFolder() {
      const newDir = remote.dialog.showOpenDialogSync({
        properties: ['openDirectory']
      })
      if (newDir && newDir.length > 0 && fs.existsSync(newDir[0])) {
        const newDirPath = newDir[0]

        this.enableBackup(newDirPath)
      }
    },
    enableBackup(path) {
      const existsAlready = this.findBackupByPath(this.backups, path)

      if (!existsAlready) {
        const newBackup = { path, enabled: true }
        this.backupsToCreate.push(newBackup)
        this.backups.push(newBackup)
      } else {
        existsAlready.enabled = true

        const toDisable = this.findBackupByPath(this.backupsToDisable, path)
        if (toDisable) {
          this.deleteBackupFromList(this.backupsToDisable, path)
        } else {
          this.backupsToEnable.push(existsAlready)
        }
      }
    },
    disableBackup() {
      const dialogCallback = (response = 0, deleteFromTheCloud = false) => {
        if (response === 1) {
          const toCreate = this.findBackupByPath(
            this.backupsToCreate,
            this.backupSelected.path
          )
          const toEnable = this.findBackupByPath(
            this.backupsToEnable,
            this.backupSelected.path
          )

          if (toCreate) {
            this.deleteBackupFromList(
              this.backupsToCreate,
              this.backupSelected.path
            )
            this.deleteBackupFromList(this.backups, this.backupSelected.path)
          } else if (toEnable) {
            this.deleteBackupFromList(
              this.backupsToEnable,
              this.backupSelected.path
            )
            this.findBackupByPath(
              this.backups,
              this.backupSelected.path
            ).enabled = false
          } else {
            this.backupsToDisable.push(this.backupSelected)
            this.findBackupByPath(
              this.backups,
              this.backupSelected.path
            ).enabled = false
          }

          if (deleteFromTheCloud && this.backupSelected.id) {
            deleteBackup(this.backupSelected.id)
          }

          this.backupSelected = null
        }
      }

      this.$store.originalDispatch('showSettingsDialog', {
        title: `Stop backing up "${this.basename(this.backupSelected.path)}"?`,
        description: `This folder will remain in your device.`,
        answers: [{ text: 'Cancel' }, { text: 'Stop backup', state: 'accent' }],
        checkbox: `Also delete this folder from the cloud`,
        buttonsInColumn: false,
        callback: dialogCallback
      })
    },
    async save(closeAfter = true) {
      const createPromises = this.backupsToCreate.map(backup =>
        createBackup(backup, this.backupsBucket)
      )
      const enablePromises = this.backupsToEnable.map(({ id }) =>
        updateBackup({ id, enabled: true })
      )
      const disablePromises = this.backupsToDisable.map(({ id }) =>
        updateBackup({ id, enabled: false })
      )

      if (!closeAfter) {
        try {
          this.resetChanges()
          await Promise.all([
            ...createPromises,
            ...enablePromises,
            ...disablePromises
          ])
          this.getAllBackups()
        } catch (err) {
          console.log(err)
          remote.app.emit(
            'show-error',
            'Something went wrong while saving your backups settings'
          )
          this.getAllBackups()
        }
      } else {
        this.$emit('close')
      }
    },
    findBackupByPath(arr, path) {
      return arr.find(backup => backup.path === path)
    },
    deleteBackupFromList(arr, path) {
      const index = arr.findIndex(backup => backup.path === path)
      if (index !== -1) {
        arr.splice(index, 1)
      }
    },
    resetChanges() {
      this.backupsToCreate = []
      this.backupsToEnable = []
      this.backupsToDisable = []
    },
    findErrorForBackup(id) {
      return this.errors.find(error => error.backup_id === id)
    },
    basename(completePath) {
      return path.basename(completePath)
    },
    openParentFolder(completePath) {
      const parentPath = path.parse(completePath).dir
      electron.shell.openPath(parentPath)
    },
    async findFolder(backup) {
      let familiarPath = path.dirname(backup.path)

      while (!fs.existsSync(path.join(familiarPath))) {
        familiarPath = path.dirname(familiarPath)
      }

      const newDir = remote.dialog.showOpenDialogSync({
        properties: ['openDirectory'],
        defaultPath: path.join(familiarPath)
      })

      if (newDir) {
        await updateBackupPath({
          id: backup.id,
          backupsBucketId: this.backupsBucket,
          plainPath: newDir[0]
        })
        this.resetChanges()
        this.getAllBackups()
        this.startBackupProcess()
      }
    },
    startBackupProcess() {
      ipcRenderer.send('start-backup-process')
    }
  },
  computed: {
    thereIsSomethingToSave() {
      return (
        this.backupsToCreate.length ||
        this.backupsToEnable.length ||
        this.backupsToDisable.length
      )
    },
    enabledBackups() {
      return this.backups.filter(backup => backup.enabled)
    }
  }
}
</script>
