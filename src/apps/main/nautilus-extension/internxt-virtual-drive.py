import os


from gi.repository import Nautilus, GObject, Gtk, Gdk
import requests
import base64
import urllib.parse


SYNC_STATUS_ATTRIBUTE ="SYNC_STATUS"
SYNC_STATUS_ATTRIBUTE_NAME ="Sync Status"
SYNC_STATUS_ONLY_ONLINE="Only online"

VIRTUAL_DRIVE_ROOT_FOLDER_NAME = "Internxt%20Drive"

status_to_column_status_map = {
  "on_local": "Offline Available",
  "on_remote": "Online Only",
  "downloading": "Downloading",
  "removing": "Removing"
}

status_to_emblem_map = {
   "on_local": "drive-removable-media",
   "on_remote": "weather-overcast",
   "downloading": "appointment-soon",
   "removing": "appointment-soon"
}

base_url = "http://localhost:4567/hydration/"


class InternxtVirtualDrive(GObject.Object, Nautilus.MenuProvider, Nautilus.ColumnProvider,
                      Nautilus.InfoProvider):
    def _window_removed(self, application, window):
        window_id = window.get_id()
        if window_id in self.selected_files:
            del self.selected_files[window_id]

    def __init__(self):
        print('InternxtVirtualDrive Extension loaded')
        self.display = Gdk.Display.get_default()

        self.selected_files = {}

        app = Gtk.Application.get_default()
        app.connect("window-removed", self._window_removed)


        # Represents if is connected to the fuse folder
        self.connected = True


        user_home = os.path.expanduser("~")
        root_folder = os.path.join(user_home, VIRTUAL_DRIVE_ROOT_FOLDER_NAME)
        self.root_folder = root_folder
        self.file_base_dir = f"file://{self.root_folder}"

    def get_file_items(self, *args):
        app = Gtk.Application.get_default()
        window = app.get_active_window()
        files = args[-1]

        self.selected_files[window.get_id()] = files

        return self._create_menu_items(files, "File")

    def get_background_items(self, *args):
        file = args[-1]
        return self._create_menu_items([file], "Background")

    def _file_is_in_virtual_drive(self, file):
        file_uri = file.get_uri();
        return self.root_folder in file_uri

    def _file_is_virtual_drive(self, file):
        file_uri = file.get_uri();
        return self.file_base_dir == file_uri

    def _setItemStatus(self, file, status):

      if status is None:
        return

      emblem = status_to_emblem_map[status]

      if emblem == '' or emblem is None:
         return

      file.invalidate_extension_info()
      file.add_emblem(emblem)


    def _get_availability(self, file):
      base64_encoded = self._encode_file_path(file)

      if file.is_directory() :
        url = base_url + 'folders/' + base64_encoded
      else :
        url = base_url + 'files/' + base64_encoded


      response = requests.get(url)

      if (response.status_code == 200):
        data = response.json()

        if data['locallyAvaliable']:
          return 'on_local'
        else:
          return 'on_remote'

      else:
         return None


    def _update_file_status(self, file):

      status = self._get_availability(file)

      # if status is None:
      #    file.invalidate_extension_info()
      #    return

      if status is None:
        return

      self._setItemStatus(file, status)
      self._set_sync_status_column_attribute(file, status)

    def _set_sync_status_column_attribute(self, file, status):

      text = status_to_column_status_map[status]

      file.add_string_attribute(SYNC_STATUS_ATTRIBUTE_NAME, text)

    def _create_menu_items(self, files, group):
        active_items = []

        local_files = []
        remote_files = []

        for file in files:
          if self._file_is_in_virtual_drive(file):
            status = self._get_availability(file)

            if (status == 'on_local'):
              local_files.append(file)

            if (status == 'on_remote'):
              remote_files.append(file)

        if len(local_files) > 0:
          clear = Nautilus.MenuItem(
              name="InternxtVirtualDrive::CLEAR" + group,
              label="Make remote only",
          )
          clear.connect("activate", self._make_remote_only, local_files)

          active_items.append(clear)

        if len(remote_files) > 0:
          download = Nautilus.MenuItem(
                name="InternxtVirtualDrive::DOWNLOAD" + group,
                label="Make Available Offline",
            )
          download.connect("activate", self._make_locally_available, remote_files)
          active_items.append(download)

        return active_items

    def _encode_file_path(self, file):
      relative_path = file.get_uri().replace(self.file_base_dir, '')

      parsed = urllib.parse.unquote(relative_path)

      bytes_data = parsed.encode('utf-8')
      return base64.b64encode(bytes_data).decode('utf-8')


    def _make_locally_available(self, menu, files):
        for file in files:
            self._setItemStatus(file, 'downloading')

            base64_encoded = self._encode_file_path(file)

            if file.is_directory():
              url = base_url + 'folders/' + base64_encoded
            else:
              url = base_url + 'files/' + base64_encoded

            response = requests.post(url)

            print(response.status_code)

            # if (response.status_code == 202):
            #   self._setItemStatus(file, 'on_local')

    def _make_remote_only(self, menu, files):
        for file in files:
            self._setItemStatus(file, 'removing')

            base64_encoded = self._encode_file_path(file)

            if file.is_directory() :
              url = base_url + 'folders/' + base64_encoded
            else:
              url = base_url + 'files/' + base64_encoded

            print(url)

            response = requests.delete(url)

            print(response.status_code)

            if (response.status_code == 201):
              self._setItemStatus(file, 'on_remote')


    def get_columns(self):
      return (Nautilus.Column(name='InternxtVirtualDrive::sync',
          attribute=SYNC_STATUS_ATTRIBUTE_NAME,
          label=SYNC_STATUS_ATTRIBUTE_NAME,
          description="Sync status"),)

    def update_file_info(self, file):
      if not self._file_is_in_virtual_drive(file):
        return

      if self._file_is_virtual_drive(file):
        return

      # if file.is_directory():
      #   return

      self._update_file_status(file)




