import * as fs from 'fs'
import { Express, Request, Response } from 'express'
import dayjs from 'dayjs'
import cardMiddleware from './middleware/card'
import libraryMiddleware from './middleware/library'
import { isLogin } from './modules/login'
import { isVPNLogin } from './modules/vpn/login'
// import { ModulesResponse } from './shared/types'

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

async function getModules(vpn = false) {
  let files: string[] = []

  const rootDir = `./src/modules${vpn ? '/vpn' : ''}`

  await fs.promises.readdir(rootDir).then((res) => {
    files = res
  }).catch((err) => {
    console.log('An error occurred when read dir\n', err)
  })

  return files.filter(item => item.endsWith('.ts')).map((item) => {
    let post = false
    let filename = item.replace('.ts', '')
    if (filename.endsWith('.post')) {
      post = true
    }
    const module = require(`./modules/${vpn ? 'vpn/' : ''}${filename}`).default
    if (post) {
      filename = filename.replace('.post', '')
    }
    const route = getRoute(filename)

    return { module, route: `${vpn ? '/vpn' : ''}${route}`, post }
  })
}

export interface IQuery<ReqQuery = any> {
  req: Request<any, any, any, ReqQuery>
  res: Response
  cookie: string
}

function routerHandler(req: Request, res: Response, item: { module: any; route: string }) {
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

  (item.route.includes('vpn') ? isVPNLogin : isLogin)(cookie).then(async(response) => {
    if (
      response || /(\/vpn)?\/(login)+(\/verify)?/.test(item.route)
    ) {
      try {
        if (item.route.startsWith('/card') || item.route.startsWith('/vpn/card')) {
          await cardMiddleware(query.cookie)
        }
        if (item.route.startsWith('/library') || item.route.startsWith('/vpn/library')) {
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
        console.log(`${dayjs().format('YYYY-MM-DD HH:mm:ss')}[OK] ${cookieValue} ${item.route}`)
      } catch (err) {
        console.log(`${dayjs().format('YYYY-MM-DD HH:mm:ss')}[ERR] ${cookieValue || ''} ${item.route}  ${err} at ${(err as Error).stack}`)
        res.status(500).send({
          code: 500,
          msg: '服务器错误1',
          stack: (err as Error).stack?.toString(),
        })
      }
    } else {
      res.status(401).send({
        msg: '请登录后查看',
        code: 401,
      })
    }
  })
}

async function setupRoute(app: Express) {
  const modules = [...await getModules(), ...await getModules(true)]

  modules.forEach((item) => {
    if (item.post) {
      app.post(item.route, (req, res) => routerHandler(req, res, item))
    } else {
      app.get(item.route, (req, res) => routerHandler(req, res, item))
    }
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
    res.status(500).send({ code: 500, msg: '服务器错误2' })
    next()
  })
}

export async function setupServer(app: Express) {
  setupServerConfig(app)
  await setupRoute(app)
}
