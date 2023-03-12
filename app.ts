import express from 'express'
import { setupServer } from './src/server'

const app = express()
app.use(express.json())

// 端口
const port = 8082

async function start() {
  app.get('/', async(req, res) => {
    res.send({
      msg: '你干嘛~，哎哟',
    })
  })

  await setupServer(app)

  app.listen(port, async() => {
    console.log(`Server is running on port ${port}`)
  })
}

start()
