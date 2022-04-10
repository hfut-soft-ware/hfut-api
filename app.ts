import express from 'express'
import config from './src/config/config'
import { setupServer } from './src/server'

const app = express()

app.listen(config.server.port, () => {
  console.log(`Server is running on port ${config.server.port}`)
  setupServer()
})
