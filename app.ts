import express from 'express'
import { setupServer } from './src/server'

const app = express()

async function start() {
  app.get('/', (req, res) => {
    res.send({
      data: {
        a: app.route,
      },
    })
  })

  await setupServer(app)

  const port = 5050

  app.listen(port, async() => {
    console.log(`Server is running on port ${port}`)
  })
}

start()
