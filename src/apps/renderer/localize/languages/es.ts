import { Translation } from '../i18n.types';

export const es: Translation = {
  login: {
    email: {
      section: 'Correo electrónico',
    },
    password: {
      section: 'Contraseña',
      placeholder: 'Contraseña',
      forgotten: '¿Has olvidado tu contraseña?',
      hide: 'Ocultar',
      show: 'Mostrar',
    },
    action: {
      login: 'Iniciar sesión',
      'is-logging-in': 'Iniciando sesión...',
    },
    'create-account': 'Crear cuenta',
    '2fa': {
      section: 'Código de autenticación',
      description: 'Has configurado la autenticación en dos pasos, por favor introduce el código de 6 dígitos',
      'change-account': 'Cambiar cuenta',
      'wrong-code': 'Código incorrecto, inténtalo de nuevo',
    },
    error: {
      'empty-fields': 'Contraseña o correo electrónico incorrectos',
    },
    warning: {
      'no-internet': 'Sin conexión a internet',
    },
  },
  onboarding: {
    slides: {
      welcome: {
        title: 'Internxt Desktop',
        description:
          '¡Bienvenido a Internxt!\n\nHaz copias de seguridad de tus archivos con Drive, protégelos contra malware con Antivirus y optimiza el rendimiento con Cleaner — todo mientras mantienes tu privacidad protegida.',
        'take-tour': 'Hacer recorrido',
      },
      drive: {
        title: 'Drive',
        description:
          'Accede a todos tus archivos desde la carpeta de Internxt Drive en la barra lateral de {{platform_app}}.\n\nElige ahorrar espacio con archivos disponibles solo en línea o mantener los esenciales sin conexión — todo permanece seguro y sincronizado en todos tus dispositivos.',
      },
      antivirus: {
        title: 'Antivirus',
        description:
          'Protege tu dispositivo contra el malware y las amenazas en línea.\n\nInternxt Antivirus te mantiene seguro con análisis en tiempo real y una seguridad que prioriza tu privacidad.',
      },
      backups: {
        title: 'Backup',
        description:
          'Con la función de copia de seguridad mejorada de Internxt, ahora puedes hacer copias seguras de tus carpetas en la nube para liberar espacio localmente.\n\nTambién puedes ajustar la frecuencia de las copias de seguridad según tus necesidades.',
      },
      cleaner: {
        title: 'Cleaner',
        description:
          'Libera espacio localmente y optimiza el rendimiento de tu dispositivo.\n\nNuestro limpiador detecta y elimina archivos innecesarios para que tu dispositivo funcione sin problemas.',
      },
      'onboarding-completed': {
        title: 'Ya está todo listo, ¡disfruta de tu privacidad!',
        'desktop-ready': {
          title: 'Internxt está listo',
          description: 'Accede a tus archivos almacenados desde la barra lateral de tu {{platform_phrase}}.',
        },
      },
    },
    common: {
      'onboarding-progress': '{{current_slide}} de {{total_slides}}',
      continue: 'Continuar',
      'open-drive': 'Abrir Internxt',
      skip: 'Saltar',
      'platform-phrase': {
        windows: 'explorador de archivos',
      },
      new: 'Nuevo',
    },
  },
  widget: {
    header: {
      usage: {
        of: 'de',
        upgrade: 'Comprar espacio',
      },
      dropdown: {
        new: 'Nuevo',
        preferences: 'Preferencias',
        sync: 'Sincronizar',
        issues: 'Lista de errores',
        support: 'Ayuda',
        antivirus: 'Antivirus',
        logout: 'Cerrar sesión',
        quit: 'Salir',
        'logout-confirmation': {
          title: '¿Cerrar sesión en este dispositivo?',
          message: 'Internxt no se mostrará sin una cuenta iniciada.',
          confirm: 'Cerrar sesión',
          cancel: 'Cancelar',
        },
        cleaner: 'Cleaner',
      },
    },
    body: {
      activity: {
        operation: {
          downloading: 'Descargando',
          preparing: 'Preparando',
          decrypting: 'Desencriptando',
          uploading: 'Subiendo',
          encrypting: 'Encriptando',
          downloaded: 'Descargado',
          cancel_downloaded: 'Descarga Cancelada',
          uploaded: 'Subido',
          deleting: 'Moviendo a la papelera',
          deleted: 'Movido a la papelera',
          moved: 'Movido',
        },
      },
      'no-activity': {
        title: 'No hay actividad reciente',
        description: 'La información aparecerá aquí cuando hagas cambios, para sincronizar tu carpeta local con Internxt Drive',
      },
      upToDate: {
        title: 'Tus archivos están actualizados',
        subtitle: 'La actividad de sincronización se mostrará aquí',
      },
      errors: {
        sync: {},
        backups: {
          'folder-not-found': {
            text: 'No se pudo realizar la copia, no se encuentra la carpeta',
            action: 'Ver error',
          },
        },
      },
    },
    footer: {
      'action-description': {
        syncing: 'Sincronizando tus archivos',
        updated: 'Sincronizado',
        failed: 'Sincronización fallida',
        'sync-pending': 'Sincronización pendiente',
      },
      errors: {
        lock: 'Sincronización bloqueada por otro dispositivo',
        offline: 'No hay conexión a internet',
      },
    },
    'sync-error': {
      title: 'No se puede acceder al contenido',
      message: 'Parece que hay problemas para obtener el contenido de la nube, por favor inténtalo de nuevo',
      button: 'Reintentar',
    },
    banners: {
      'discover-backups': {
        title: ' COPIAS DE SEGURIDAD DE INTERNXT',
        body: 'Mantén una copia de seguridad de tus carpetas y archivos más importantes.',
        action: 'Hacer copia',
      },
    },
  },
  settings: {
    header: {
      section: {
        GENERAL: 'General',
        ACCOUNT: 'Cuenta',
        BACKUPS: 'Backups',
        ANTIVIRUS: 'Antivirus',
        CLEANER: 'Cleaner',
      },
    },
    general: {
      language: {
        label: 'Idioma',
        options: {
          es: 'Español (Español)',
          en: 'English (Inglés)',
          fr: 'Français (Francés)',
        },
      },
      theme: {
        label: 'Apariencia',
        options: {
          system: 'Sistema',
          light: 'Claro',
          dark: 'Oscuro',
        },
      },
      device: {
        section: 'Nombre del dispositivo',
        action: {
          edit: 'Editar',
          cancel: 'Cancelar',
          save: 'Guardar',
        },
      },
      'auto-startup': 'Iniciar Internxt al arrancar el sistema',
      sync: {
        folder: 'Carpeta Internxt',
        'change-folder': 'Cambiar carpeta',
      },
      'app-info': {
        'open-logs': 'Abrir registros',
        more: 'Más información sobre Internxt',
      },
    },
    account: {
      logout: 'Cerrar sesión',
      usage: {
        display: 'Usado {{used}} de {{total}}',
        upgrade: 'Comprar espacio',
        change: 'Cambiar',
        plan: 'Plan actual',
        free: 'Gratis',
        loadError: {
          title: 'No se han podido obtener tus datos de uso',
          action: 'Reintentar',
        },
        current: {
          used: 'usado',
          of: 'de',
          'in-use': 'usado',
        },
        full: {
          title: 'Tu almacenamiento está lleno',
          subtitle:
            'No puedes subir, sincronizar ni hacer copias de seguridad de archivos. Amplía ahora tu plan o elimina archivos para ahorrar espacio.',
        },
      },
    },
    backups: {
      title: 'Carpetas de copia de seguridad',
      'add-folders': 'Haz clic en + para hacer una copia de seguridad de tus carpetas',
      'selected-folder_one': '{{count}} carpeta',
      'selected-folder_other': '{{count}} carpetas',
      activate: 'Hacer copia de seguridad de tus carpetas',
      'view-backups': 'Explorar backups',
      'selected-folders-title': 'Carpetas seleccionadas',
      'select-folders': 'Cambiar carpetas',
      'last-backup-had-issues': 'La última copia de seguridad tuvo algunos problemas',
      'see-issues': 'Ver problemas',
      'backing-up': 'Haciendo la copia',
      action: {
        start: 'Hacer copia',
        stop: 'Stop backup',
        running: 'Subiendo backup {{progress}}',
        'last-run': 'Última ejecución',
      },
      frequency: {
        title: 'Frecuencia de subida',
        options: {
          '1h': 'Cada hora',
          '6h': 'Cada 6 horas',
          '12h': 'Cada 12 horas',
          '24h': 'Cada día',
          manually: 'Manual',
        },
        warning:
          "Las carpetas no se respaldarán automáticamente hasta que haga clic en 'Copia de seguridad ahora'. Este modo no se recomienda.",
      },
      folders: {
        'no-folders': 'No hay carpetas seleccionadas',
        'no-folders-to-download': 'No hay carpetas para descargar',
        save: 'Guardar',
        cancel: 'Cancelar',
        error: 'No pudimos encontrar la carpeta seleccionada',
      },
      delete: {
        title: 'Eliminar copia de seguridad',
        explanation: 'Esta copia de seguridad se eliminará de la nube, todas las carpetas y archivos permanecerán en este ordenador',
        action: 'Eliminar copia de seguridad',
        'deletion-modal': {
          title: 'Borrar copia de seguridad?',
          explanation:
            'Esta copia de seguridad se eliminará permanentemente de la nube, todas las carpetas y archivos permanecerán en este ordenador.',
          'explanation-2': 'Esta acción no se puede deshacer.',
          confirm: 'Sí, eliminar',
          cancel: 'Cancelar',
        },
      },
      stop: {
        modal: {
          title: 'Detener copia de seguridad en curso',
          explanation: 'Todavía hay archivos que no se han subido. ¿Detener la copia de seguridad de todos modos?',
          'explanation-2': '',
          confirm: 'Detener',
          cancel: 'Cancelar',
        },
      },
    },
    antivirus: {
      featureLocked: {
        title: 'Función bloqueada',
        subtitle: 'Por favor, actualiza tu plan para usar esta función.',
        action: 'Actualizar',
      },
      errorState: {
        title: 'Algo salió mal al escanear el directorio',
        button: 'Intentar de nuevo',
      },
      scanOptions: {
        stopScan: 'Detener escaneo',
        systemScan: {
          text: 'Escaneo del sistema antivirus',
          action: 'Iniciar escaneo',
        },
        customScan: {
          text: 'Escaneo personalizado del antivirus',
          action: 'Elegir',
          selector: {
            files: 'Archivos',
            folders: 'Carpetas',
          },
        },
        removeMalware: {
          actions: {
            cancel: 'Cancelar',
            remove: 'Eliminar',
          },
          actionRequired: {
            title: 'Acción requerida',
            description:
              'Al eliminar el malware, también se eliminará permanentemente la carpeta de tu almacenamiento para proteger tu dispositivo. Esta acción no se puede deshacer.',
            confirmToContinue: 'Confirma para continuar.',
          },
          securityWarning: {
            title: 'Advertencia de seguridad',
            description: 'El malware sigue presente y tu dispositivo está en riesgo.',
            confirmToCancel: '¿Estás seguro de que deseas cancelar?',
          },
        },
      },
      scanProcess: {
        countingFiles: 'Contando archivos...',
        scanning: 'Escaneando...',
        scannedFiles: 'Archivos escaneados',
        detectedFiles: 'Archivos detectados',
        errorWhileScanning: 'Ocurrió un error al escanear los elementos. Por favor, intenta nuevamente.',
        noFilesFound: {
          title: 'No se encontraron amenazas',
          subtitle: 'No es necesario realizar más acciones',
        },
        malwareFound: {
          title: 'Malware detectado',
          subtitle: 'Por favor, revisa y elimina las amenazas.',
          action: 'Eliminar malware',
        },
        scanAgain: 'Escanear nuevamente',
      },
      filesContainingMalwareModal: {
        title: 'Archivos que contienen malware',
        selectedItems: 'Seleccionados {{selectedFiles}} de {{totalFiles}}',
        selectAll: 'Seleccionar todo',
        actions: {
          cancel: 'Cancelar',
          remove: 'Eliminar',
        },
      },
    },
    cleaner: {
      selectAllCheckbox: 'Seleccionar todo',
      mainView: {
        cleanup: 'Limpiar',
      },
      generateReportView: {
        title: 'Ningún escaneo todavía',
        description: 'Escanee su sistema para encontrar archivos que pueda eliminar de forma segura y liberar espacio.',
        generateReport: 'Ejecutar escaneo',
      },
      loadingView: {
        title: 'Espera un momento',
        description: 'Estamos generando tu informe...',
      },
      sizeIndicatorView: {
        selectCategory: 'Seleccione una categoría para',
        previewContent: 'obtener una vista previa del contenido',
        saveUpTo: 'Ahorra hasta',
        ofYourSpace: 'de tu espacio',
      },
      cleanupConfirmDialogView: {
        title: 'Confirmar borrado',
        description:
          'Esta acción eliminará permanentemente los archivos seleccionados de tu dispositivo. Esta acción no se puede deshacer. Confirme para continuar.',
        cancelButton: 'Cancelar',
        confirmButton: 'Eliminar archivos',
      },
      cleaningView: {
        cleaningProcess: {
          title: 'Limpiando...',
          stopCleanButton: 'Detener limpieza',
          deletedFiles: 'Archivos eliminados',
          freeSpaceGained: 'Espacio libre ganado',
        },
        cleaningFinished: {
          title: 'Tu dispositivo está limpio',
          subtitle: 'No es necesario realizar ninguna otra acción',
          finish: 'Finalizar',
        },
      },
    },
  },
  issues: {
    title: 'Lista de errores',
    tabs: {
      sync: 'Sincronización',
      backups: 'Copias de seguridad',
      general: 'General',
      antivirus: 'Antivirus',
    },
    'no-issues': 'No se han encontrado errores',
    actions: {
      'select-folder': 'Seleccionar carpeta',
      'find-folder': 'Buscar la carpeta',
      'try-again': 'Volver a intentar',
    },
    'report-modal': {
      actions: {
        close: 'Cerrar',
        cancel: 'Cancelar',
        report: 'Informar',
        send: 'Enviar',
      },
      'help-url': 'Para obtener ayuda, visita',
      report: 'También puedes enviar un informe sobre este error',
      'user-comments': 'Comentarios',
      'include-logs': 'Incluir los registros de este proceso de sincronización con fines de solucionar el error',
    },
    errors: {
      ABORTED: 'Abortado',
      CREATE_FOLDER_FAILED: 'Error al crear la carpeta',
      DELETE_ERROR: 'No se pudo eliminar el elemento',
      FILE_MODIFIED: 'Archivo modificado durante la subida',
      FILE_SIZE_TOO_BIG: 'Archivo es demasiado grande (máximo 40GB)',
      FOLDER_ACCESS_DENIED: 'La app no tiene permiso para acceder a esta carpeta',
      FOLDER_DOES_NOT_EXIST: 'Carpeta no existe',
      INVALID_WINDOWS_NAME: String.raw`Windows no permite nombres que incluyen los caracteres \ / : * ? " < > |`,
      NETWORK_CONNECTIVITY_ERROR: 'Error de conectividad de red',
      NOT_ENOUGH_SPACE: 'No tienes suficiente espacio para completar la operación',
      PARENT_FOLDER_DOES_NOT_EXIST: 'Carpeta padre no existe',
      ROOT_FOLDER_DOES_NOT_EXIST: 'Carpeta raíz no existe',
      SERVER_INTERNAL_ERROR: 'Error interno del servidor',
      UNKNOWN_DEVICE_NAME: 'No se pudo obtener el nombre de tu dispositivo',
      WEBSOCKET_CONNECTION_ERROR: 'Error de conexión WebSocket',
    },
  },
  common: {
    cancel: 'Cancelar',
  },
};
