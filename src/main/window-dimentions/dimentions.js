const dimentions = {
  '/xcloud': {
    width: 450,
    height: 360
  },
  '/onboarding': {
    width: 800,
    height: 500
  },
  '/login': {
    width: 450,
    height: 360
  }
}

class Dimentions {
  dimentions = dimentions

  constructor(trayMenu, primaryDisplay) {
    this.this.trayBounds = trayMenu.tray.getBounds()
    this.display = primaryDisplay

    this.dimentions['/xcloud'].x = this.this.trayBounds.x
    this.dimentions['/xcloud'].y = this.this.trayBounds.y
  }

  getDimentions(route) {
    return this.dimentions[route]
  }

  getWindowPosition() {
    let x = Math.min(this.trayBounds.x - 450 / 2, this.display.width - 450)
    x = Math.max(this.display.x, x)
    let y = Math.min(this.trayBounds.y - 360 / 2, this.display.height - 360)
    y = Math.max(this.display.y, y)
    return {
      x: x,
      y: y
    }
  }
}

module.exports = Dimentions
