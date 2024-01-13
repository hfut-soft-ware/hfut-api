import fs from 'node:fs/promises'
import { Express, Request, Response } from 'express'
import dayjs from 'dayjs'
import cardMiddleware from './middleware/card'
import libraryMiddleware from './middleware/library'
import { isLogin } from './modules/login'
import { isLogin as isCommunityLogin } from './modules/community/login'
import { isVPNLogin } from './modules/vpn/login'
import type { ServerFunction } from '@/shared/types'

type ModuleType = '' | 'vpn' | 'community'

async function getModules(moduleType: ModuleType = '') {
  const rootDir = `./src/modules/${moduleType}`
  let files: string[] = []

  try {
    files = await fs.readdir(rootDir)
  } catch (err) {
    console.log('An error occurred when read dir\n', err)
  }

  return await Promise.all(files.filter(item => item.endsWith('.ts')).map(async(item) => {
    let post = false
    let filename = item.replace('.ts', '')
    if (filename.endsWith('.post')) {
      post = true
    }
    const module = (await import(`./modules/${moduleType}/${filename}`)).default as ServerFunction
    if (post) {
      filename = filename.replace('.post', '')
    }
    const route = filename.replaceAll('_', '/')

    return { module, route: `${moduleType ? `/${moduleType}` : ''}/${route}`, post }
  }))
}

function getIsLoginFunction(route: string) {
  if (route.includes('community')) {
    return isCommunityLogin
  }
  if (route.includes('vpn')) {
    return isVPNLogin
  }

  return isLogin
}

// export interface IQuery<ReqQuery = any> {
//   req: Request<any, any, any, ReqQuery>
//   res: Response
//   cookie: string
// }

export interface IQuery<T = any> {
  req: Request<any, any, any, T>
  res: Response
  cookie: string
}

function routerHandler(req: Request, res: Response, item: { module: ServerFunction; route: string }) {
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

  (getIsLoginFunction(item.route))(cookie).then(async(response) => {
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

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        res.status(moduleResponse.code || moduleResponse?.status).send(moduleResponse?.body || moduleResponse)
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
  const moduleTypes: ModuleType[] = ['', 'vpn', 'community']
  const modules = (await Promise.all(moduleTypes.map(async item => await getModules(item)))).flat()

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
