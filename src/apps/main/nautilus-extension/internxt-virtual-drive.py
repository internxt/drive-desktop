import gi
import os


from gi.repository import Nautilus, GObject, Gtk, Gdk
from urllib.parse import urlparse, unquote
import requests
import base64


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
        # user_home = os.path.expanduser("~")
        # internxtDrive = os.path.join(user_home, 'InternxtDrive')
        return self.root_folder in file_uri

    def _create_menu_items(self, files, group):
        active_items = []


        filtered_files = []
        for file in files:
            if self._file_is_in_virtual_drive(file):
             filtered_files.append(file)

        if len(filtered_files) > 0:
            download = Nautilus.MenuItem(
                name="InternxtVirtualDrive::DOWNLOAD" + group,
                label="Download",
            )
            download.connect("activate", self._download, filtered_files)
            active_items.append(download)


            clear = Nautilus.MenuItem(
                name="InternxtVirtualDrive::CLEAR" + group,
                label="Clear",
            )
            clear.connect("activate", self._clear, filtered_files)

            active_items.append(clear)

        return active_items

    def _download(self, menu, files):
        # base_path = "file:///home/jvalles/InternxtDrive/"
        for file in files:
            relative_path = file.get_uri().replace(self.file_base_dir, '')
            print(relative_path)
            bytes_data = relative_path.encode('utf-8')
            base64_encoded = base64.b64encode(bytes_data).decode('utf-8')
            url = "http://localhost:4567/contents/" + base64_encoded
            print(url)
            requests.post(url)

    def _clear(self, menu, files):
        # base_path = "file:///home/jvalles/InternxtDrive/"
        for file in files:
            relative_path = file.get_uri().replace(self.file_base_dir, '')
            print(relative_path)
            bytes_data = relative_path.encode('utf-8')
            base64_encoded = base64.b64encode(bytes_data).decode('utf-8')
            url = "http://localhost:4567/contents/" + base64_encoded
            print(url)
            requests.delete(url)


    def get_columns(self):
        return (Nautilus.Column(name='InternxtVirtualDrive::sync',
            attribute=SYNC_STATUS_ATTRIBUTE_NAME,
            label=SYNC_STATUS_ATTRIBUTE_NAME,
            description="Sync status"),)

    def update_file_info(self, file):
        if not self._file_is_in_virtual_drive(file):
            return

        file.add_string_attribute(SYNC_STATUS_ATTRIBUTE_NAME,SYNC_STATUS_ONLY_ONLINE)
        self.get_columns()
