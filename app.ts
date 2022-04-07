import express from 'express'
import config from './src/config/config'
import { login } from './src/modules/login'

const app = express()

app.listen(config.server.port, () => {
  console.log(`Server is running on port ${config.server.port}`)
})

app.get('/login', async(req, res) => {
  const query = req.query
  const result = await login({ username: query.username as string, password: query.password as string })

  if (!result) {
    res.send({
      code: -1,
      msg: '账号或密码错误',
    })

    return
  }

  res.send({
    code: 1,
    msg: '登录成功',
    data: result,
  })
})
