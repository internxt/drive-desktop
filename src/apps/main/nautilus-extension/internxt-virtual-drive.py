import gi
import os


from gi.repository import Nautilus, GObject, Gtk, Gdk
from urllib.parse import urlparse, unquote
import requests
import base64
import xattr
import urllib.parse

try:
  gi.require_version('Gtk', '4.0')
  gi.require_version('Nautilus', '4.0')
except ImportError:
    try:
      gi.require_version('Gtk', '3.0')
      gi.require_version('Nautilus', '3.0')
    except ImportError:
        print("Neither GTK 4 nor GTK 3 is available")



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
        self.display = Gdk.Display.get_default()


        self.selected_files = {}

        app = Gtk.Application.get_default()
        app.connect("window-removed", self._window_removed)


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

    def _setItemStatus(self, file, status):
      emblem = status_to_emblem_map[status]

      if emblem == '' or emblem is None:
         return

      file.invalidate_extension_info()
      file.add_emblem(emblem)


    def _get_x_attribute(self, file, key):
      path = file.get_uri().replace('file://', '').replace('%20', ' ')

      decoded_uri = urllib.parse.unquote(path)

      attrs = xattr.xattr(decoded_uri)

      if key.encode() in attrs:
        return attrs.get(key.encode()).decode('utf-8')

    def _update_file_status(self, file):

      if file.is_directory():
        return

      status = self._get_x_attribute(file, 'hydration-status')

      if status is None:
         file.invalidate_extension_info()
         return

      self._setItemStatus(file, status)
      self._set_sync_status_column_attribute(file, status)

    def _set_sync_status_column_attribute(self, file, status):

      text = status_to_column_status_map[status]

      file.add_string_attribute(SYNC_STATUS_ATTRIBUTE_NAME, text)

    def _create_menu_items(self, files, group):
        active_items = []

        filtered_files = []
        for file in files:
            if self._file_is_in_virtual_drive(file):
             filtered_files.append(file)

        if len(filtered_files) > 0:
            download = Nautilus.MenuItem(
                name="InternxtVirtualDrive::DOWNLOAD" + group,
                label="Make Available Offline",
            )
            download.connect("activate", self._make_locally_available, filtered_files)
            active_items.append(download)


            clear = Nautilus.MenuItem(
                name="InternxtVirtualDrive::CLEAR" + group,
                label="Make remote only",
            )
            clear.connect("activate", self._make_remote_only, filtered_files)

            active_items.append(clear)

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

            url = base_url + base64_encoded

            response = requests.post(url)

            print(response.status_code)

            if (response.status_code == 201):
              self._setItemStatus(file, 'on_local')

    def _make_remote_only(self, menu, files):
        for file in files:
            self._setItemStatus(file, 'removing')

            base64_encoded = self._encode_file_path(file)
            url = base_url + base64_encoded

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

        self._update_file_status(file)
