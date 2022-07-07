import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import tunnel from 'tunnel'
import { IQuery } from '../server'

export function getCookie(cookie: string | string[]): string {
  if (!Array.isArray(cookie)) {
    cookie = [cookie]
  }

  return cookie[0]
}

interface IAnswer {
  body?: AxiosResponse['data']

  cookie?: string[]

  status?: number

  config?: AxiosResponse['config']
}

const useProxyAgent = () => {
  const cachedAgent = {
    host: '',
    port: 0,
  }

  const agent = {
    tunnel: tunnel.httpsOverHttp({
      proxy: {
        ...cachedAgent,
      },
    }),
  }

  const updateAgent = async(refresh = false) => {
    const update = async() => {
      const res = await axios.get('http://api.tianqiip.com/getip?secret=vpn2vn9y5q67w430&num=1&type=json&port=2&time=15')
      const proxyIp = res.data.data[0]
      cachedAgent.host = proxyIp.ip
      cachedAgent.port = proxyIp.port

      agent.tunnel = tunnel.httpsOverHttp({
        proxy: {
          ...cachedAgent,
        },
      })
    }

    // 第一次初始化
    if (cachedAgent.port === 0 && !refresh) {
      await update()
    } else if (refresh) {
      await update()
    }
  }

  return { agent, updateAgent }
}

export function createRequest() {
  const { agent, updateAgent } = useProxyAgent()

  return async(url: string, options: AxiosRequestConfig, query?: Partial<IQuery>): Promise<IAnswer> => {
    const headers = { ...(options.headers || {}), 'cookie': query?.cookie || '', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36' }

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async(resolve, reject) => {
      const config = { url, method: 'get', maxRedirects: 0, ...options, headers } as AxiosRequestConfig

      await updateAgent()
      config.httpsAgent = agent.tunnel

      Reflect.deleteProperty(options, 'headers')

      const answer: IAnswer = Object.create(null)
      const request = () => {
        axios(config).then((res) => {
          const body = res.data
          answer.body = body

          answer.cookie = res.headers['set-cookie'] || []

          answer.config = res.config

          answer.status = body?.status || res?.status
          resolve(answer)
        }).catch(async(err) => {
          // 代理IP过期
          if (err.response === undefined) {
            await updateAgent(true)
            config.httpsAgent = agent.tunnel
            request()
          }
          answer.status = 502
          answer.body = { code: 502, msg: err }
          reject(err)
        })
      }

      request()
    })
  }
}

const request = createRequest()

export default request
