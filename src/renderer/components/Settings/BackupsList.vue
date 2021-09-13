<template>
  <div @click.stop="backupSelected = null">
    <p>Select folders you want to add to the next backup</p>
    <div
      class="
        h-52
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
        class="flex items-center pl-2 py-1"
        @click.stop="backupSelected = backup"
      >
        <input v-model="backup.enabled" type="checkbox" style="margin-right: 6px" @change="() => onBackupCheckboxChanged(backup)"/>
        <UilFolder style="margin-right: 6px" class="text-blue-500" />
        <p class="tracking-wide">{{ backup.path }}</p>
      </div>
    </div>
    <div class="flex items-center justify-between mt-3">
      <div class="flex items-center space-x-1">
        <Button @click="selectFolder">
          <div class="flex items-center">
            <UilPlus class="inline mr-1" size="18px" />
            <p>Add folder</p>
          </div>
        </Button>
        <Button :disabled="!backupSelected" @click="removeBackup">
          <div class="flex items-center">
            <UilTrashAlt class="inline mr-1" size="18px" />
            <p>Remove folder</p>
          </div>
        </Button>
      </div>
      <div class="flex items-center space-x-1">
        <Button @click="$emit('close')">Cancel</Button>
        <Button state="accent" :disabled="!thereIsSomethingToSave" @click="save">Save</Button>
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
import {getAllBackups, createBackup, deleteBackup, updateBackup} from '../../../backup-process/service'
import Button from '../Button/Button.vue'
import fs from 'fs'
const remote = require('@electron/remote')

export default {
  components: {UilFolder, Button, UilPlus, UilTrashAlt},
  props: ['backupsBucket'],
  data() {
    return {
      backups: [
      ],
      backupsToAdd: [],
      backupsToDelete: [],
      backupsToUpdate: [],
      backupSelected: null
    }
  },
  mounted() {
    this.getAllBackups()
  },
  methods: {
    async getAllBackups() {
      this.backups = await getAllBackups()
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

      const newBackup = {path, enabled: false}
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
    async save() {
      console.log('Backups to add ', this.backupsToAdd)
      console.log('Backups to delete ', this.backupsToDelete)
      console.log('Backups to update ', this.backupsToUpdate)

      const addPromises = this.backupsToAdd.map(backup => createBackup(backup, this.backupsBucket))
      const deletePromises = this.backupsToDelete.map(backup => deleteBackup(backup.id))
      const updatePromises = this.backupsToUpdate.map(({id, enabled}) => updateBackup({id, enabled}))

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
    }
  },
  computed: {
    thereIsSomethingToSave() {
      return this.backupsToAdd.length || this.backupsToDelete.length || this.backupsToUpdate.length
    }
  }
}
</script>