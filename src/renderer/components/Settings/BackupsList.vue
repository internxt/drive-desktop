<template>
  <div @click.stop="backupSelected = null">
    <p class="text-sm">Select folders you want to add to the next backup</p>
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
        v-for="(backup, i) in backups"
        :key="backup.id"
        :class="{
          'bg-gray-50': i % 2 != 0 && backupSelected != backup,
          'bg-blue-50': backupSelected === backup,
        }"
        class="flex items-center justify-between px-2 py-1 max-w-full"
        @click.stop="backupSelected = backup"
        @dblclick="() => openFolder(backup.path)"
      >
        <div class="flex items-center overflow-hidden">
          <input v-model="backup.enabled" type="checkbox" style="margin-right: 6px" @change="() => onBackupCheckboxChanged(backup)"/>
          <UilFolder style="margin-right: 6px" class="text-blue-500 flex-shrink-0" />
          <p class="truncate">{{ basename(backup.path) }}</p>
        </div>
        <BackupsError :error="findErrorForBackup(backup.id)" @actionClick="(action) => action === 'FIND_FOLDER' ? findFolder(backup) : startBackupProcess()"/>
      </div>
      <content-placeholders v-if="loading" :rounded="true" class="mt-2 ml-2">
        <content-placeholders-text v-for="i in 4" :lines="1" :key="i" />
      </content-placeholders>
    </div>
    <div class="flex items-center justify-between mt-3">
      <div class="flex items-center space-x-1">
        <Button @click="selectFolder">
          <div class="flex items-center">
            <UilPlus class="inline mr-1" size="18px" />
            <p>Add folder</p>
          </div>
        </Button>
        <Button v-if="false" :state="backupSelected ? 'red' : 'red-disabled'" @click="removeBackup">
          <div class="flex items-center">
            <UilTrashAlt class="inline mr-1" size="18px" />
            <p>Remove folder</p>
          </div>
        </Button>
      </div>
      <div class="flex items-center space-x-1">
        <Button @click="$emit('close')">Cancel</Button>
        <Button :state="thereIsSomethingToSave ? 'accent' : 'accent-disabled'" @click="save">Save</Button>
      </div>
    </div>
  </div>
</template>

<script>
import {
  UilFolder,
  UilPlus,
  UilTrashAlt
} from '@iconscout/vue-unicons'
import {getAllBackups, createBackup, deleteBackup, updateBackup, updateBackupPath} from '../../../backup-process/service'
import Button from '../Button/Button.vue'
import fs from 'fs'
import path from 'path'
import electron, {ipcRenderer} from 'electron'
import BackupsError from './BackupError.vue'
const remote = require('@electron/remote')

export default {
  components: {UilFolder, Button, UilPlus, UilTrashAlt, BackupsError},
  props: ['backupsBucket', 'errors'],
  data() {
    return {
      backups: [
      ],
      backupsToAdd: [],
      backupsToDelete: [],
      backupsToUpdate: [],
      backupSelected: null,
      loading: false
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

        this.addBackup(newDirPath)
      }
    },
    addBackup(path) {
      const isDeleted = this.findBackupByPath(this.backupsToDelete, path)
      if (isDeleted) {
        this.backups.push(isDeleted)
        this.deleteBackupFromList(this.backupsToDelete, path)
        return
      }

      if (this.findBackupByPath(this.backups, path)) { return }

      const newBackup = {path, enabled: true}
      this.backupsToAdd.push(newBackup)
      this.backups.push(newBackup)
    },
    removeBackup() {
      this.deleteBackupFromList(this.backups, this.backupSelected.path)

      const isAdded = this.findBackupByPath(this.backupsToAdd, this.backupSelected.path)

      if (isAdded) { this.deleteBackupFromList(this.backupsToAdd, this.backupSelected.path) } else {
        this.backupsToDelete.push(this.backupSelected)
        this.deleteBackupFromList(this.backupsToUpdate, this.backupSelected.path)
      }
      this.backupSelected = null
    },
    onBackupCheckboxChanged(backup) {
      const existsInDB = !this.findBackupByPath(this.backupsToAdd, backup.path)

      if (existsInDB) {
        const hasBeenCheckedAlready = this.findBackupByPath(this.backupsToUpdate, backup.path)

        if (hasBeenCheckedAlready) { this.deleteBackupFromList(this.backupsToUpdate, backup.path) } else { this.backupsToUpdate.push(backup) }
      }
    },
    async save(closeAfter = true) {
      const addPromises = this.backupsToAdd.map(backup => createBackup(backup, this.backupsBucket))
      const deletePromises = this.backupsToDelete.map(backup => deleteBackup(backup.id))
      const updatePromises = this.backupsToUpdate.map(({id, enabled}) => updateBackup({id, enabled}))

      if (!closeAfter) {
        try {
          this.resetChanges()
          await Promise.all([ ...addPromises, ...deletePromises, ...updatePromises ])
          this.getAllBackups()
        } catch (err) {
          console.log(err)
          remote.app.emit(
            'show-error',
            'Something went wrong while saving your backups settings'
          )
          this.getAllBackups()
        }
      } else { this.$emit('close') }
    },
    findBackupByPath(arr, path) {
      return arr.find(backup => backup.path === path)
    },
    deleteBackupFromList(arr, path) {
      const index = arr.findIndex(backup => backup.path === path)
      if (index !== -1) { arr.splice(index, 1) }
    },
    resetChanges() {
      this.backupsToAdd = []
      this.backupsToDelete = []
      this.backupsToUpdate = []
    },
    findErrorForBackup(id) {
      return this.errors.find(error => error.backup_id === id)
    },
    basename(completePath) {
      return path.basename(completePath)
    },
    openFolder(path) {
      electron.shell.openPath(path)
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
        await updateBackupPath({ id: backup.id, backupsBucketId: this.backupsBucket, plainPath: newDir[0] })
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
      return this.backupsToAdd.length || this.backupsToDelete.length || this.backupsToUpdate.length
    }
  }
}
</script>