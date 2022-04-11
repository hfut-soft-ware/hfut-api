import * as fs from 'fs'
import { Express } from 'express'
import { isLogin } from './modules/login'

export function getRoute(filename: string) {
  const parsedRoute = filename.split('_')
  let route = `/${parsedRoute[0]}`
  if (parsedRoute.length === 1) {
    return route
  }

  parsedRoute.splice(1).forEach((item) => {
    route += `/${item}`
  })

  return route
}

async function getModules() {
  let files: string[] = []

  await fs.promises.readdir('./src/modules').then((res) => {
    files = res
  }).catch((err) => {
    console.log('An error occurred when read dir\n', err)
  })

  const modules = files.filter(item => item.endsWith('.ts')).map((item) => {
    const filename = item.replace('.ts', '')
    const module = require(`./modules/${filename}`).default
    const route = getRoute(filename)

    return { module, route }
  })

  return modules
}

async function setupRoute(app: Express) {
  const modules = await getModules()

  modules.forEach((item) => {
    app.get(item.route, (req, res) => {
      const cookie = req.headers.cookie
      isLogin(cookie).then((response) => {
        if (response) {
          item.module(req, res, cookie)
          return
        } else {
          if (item.route === '/login') {
            item.module(req, res, cookie)
          } else {
            res.status(401).send({
              msg: '请登录后查看',
              code: 401,
            })
          }
        }
      })
    })
  })
}

function setupServerConfig(app: Express) {
  // 跨域处理
  app.use((req, res, next) => {
    if (req.path !== '/' && !req.path.includes('.')) {
      res.set({
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'X-Requested-With,Content-Type',
        'Access-Control-Allow-Methods': 'PUT,POST,GET,DELETE,OPTIONS',
        'Content-Type': 'application/json; charset=utf-8',
      })
    }
    req.method === 'OPTIONS' ? res.status(204).end() : next()
  })

  // 错误中间件
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send({ code: 500, msg: '服务器错误' })
  })
}

export async function setupServer(app: Express) {
  setupServerConfig(app)
  await setupRoute(app)
}
