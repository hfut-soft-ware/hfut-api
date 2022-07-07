import * as fs from 'fs'
import { Express } from 'express'
import { isLogin } from './modules/login'
import { ModulesRequest, ModulesResponse } from './shared/types'
import cardMiddleware from './middleware/card'
import libraryMiddleware from './middleware/library'

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

  return files.filter(item => item.endsWith('.ts')).map((item) => {
    const filename = item.replace('.ts', '')
    const module = require(`./modules/${filename}`).default
    const route = getRoute(filename)

    return { module, route }
  })
}

export interface IQuery {
  req: ModulesRequest
  res: ModulesResponse
  cookie: string
}

async function setupRoute(app: Express) {
  const modules = await getModules()

  modules.forEach((item) => {
    app.get(item.route, (req, res) => {
      const cookie = req.headers.cookie as string
      const query: IQuery = {
        req,
        res,
        cookie,
      }

      let cookieValue = 'Not Exist Cookie'
      if (cookie) {
        cookieValue = cookie.slice(0, cookie.indexOf(';')).replace('wengine_vpn_ticketwebvpn_hfut_edu_cn=', '')
      }

      isLogin(cookie).then(async(response) => {
        if (response || item.route === '/login' || item.route === '/login/verify') {
          try {
            if (item.route.startsWith('/card')) {
              await cardMiddleware(query.cookie)
            }
            if (item.route.startsWith('/library')) {
              await libraryMiddleware(query.cookie)
            }
            const moduleResponse = await item.module(query)
            const cookie = moduleResponse?.cookie
            if (cookie) {
              res.setHeader('Set-Cookie', cookie)
              delete moduleResponse.cookie
            }
            res.status(moduleResponse.code || moduleResponse.status).send(moduleResponse.body || moduleResponse)
            if (req.originalUrl.includes('login')) {
              req.originalUrl = req.originalUrl.slice(0, req.originalUrl.indexOf('&password'))
            }
            console.log(`[OK] ${cookieValue} ${req.originalUrl}`)
          } catch (err: any) {
            console.log(`[ERR] ${cookieValue} ${err} at ${err.stack}`)
            res.status(500).send({
              code: 500,
              msg: '服务器错误',
            })
          }
        } else {
          res.status(401).send({
            msg: '请登录后查看',
            code: 401,
          })
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
    next()
  })
}

export async function setupServer(app: Express) {
  setupServerConfig(app)
  await setupRoute(app)
}
