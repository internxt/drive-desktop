const local = {
  DRIVE_API: 'http://localhost:3007/api',
  DRIVE_BASE: 'http://localhost:3007'
}

const production = {
  DRIVE_API: 'https://drive.internxt.com/api',
  DRIVE_BASE: 'https://drive.internxt.com'
}

export default process.env.NODE_ENV === 'production' ? production : production
