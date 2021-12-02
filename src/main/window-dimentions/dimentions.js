const dimentions = {
  '/xcloud': {
    width: 330,
    height: 392
  },
  '/onboarding': {
    width: 900,
    height: 500
  },
  '/login': {
    width: 300,
    height: 474
  }
} /* class Dimentions {
  dimentions = dimentions

  constructor(trayMenu, screen) {
    this.trayBounds = trayMenu.tray.getBounds()
    this.display = screen.getDisplayMatching(this.trayBounds)
    const coordinatesTrayIcon = this.getLoggerWindowPos()

    this.dimentions['/xcloud'].x = coordinatesTrayIcon.x
    this.dimentions['/xcloud'].y = coordinatesTrayIcon.y
  }

  getDimentions(route) {
    return this.dimentions[route]
  }

  getLoggerWindowPos() {
    let x = Math.min(
      this.trayBounds.x - this.display.workArea.x - 450 / 2,
      this.display.workArea.width - 450
    )
    x += this.display.workArea.x
    x = Math.max(this.display.workArea.x, x)
    let y = Math.min(
      this.trayBounds.y - this.display.workArea.y - 360 / 2,
      this.display.workArea.height - 360
    )
    y += this.display.workArea.y
    y = Math.max(this.display.workArea.y, y)
    return {
      x: x,
      y: y
    }
  }
}
*/

module.exports = dimentions
