import express from 'express'
import config from './src/config/config'

const app = express()

app.listen(config.server.port, () => {
  console.log(`Server is running on port ${config.server.port}`)
})
