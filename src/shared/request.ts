import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import tunnel from 'tunnel'
import { IQuery } from '../server'
import { useThrottle } from './utils/useThrottle'

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
const getAgent = useThrottle(async() => {
  const url = 'http://route.xiongmaodaili.com/xiongmao-web/api/glip?secret=02f0fd4b8aeac2e4ac952960f07d312f&orderNo=GL20220721095032iUmJG8F4&count=1&isTxt=0&proxyType=1'
  const res = await axios.get(url)

  return tunnel.httpsOverHttp({
    proxy: {
      host: res.data.obj[0].ip,
      port: res.data.obj[0].port,
    },
  })
}, 4.5 * 60 * 1000, true)

export function createRequest() {
  return async(url: string, options: AxiosRequestConfig, query?: Partial<IQuery>): Promise<IAnswer> => {
    const headers = { ...(options.headers || {}), 'cookie': query?.cookie || '', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36' }

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async(resolve, reject) => {
      const config = { url, method: 'get', maxRedirects: 0, ...options, headers } as AxiosRequestConfig

      // const agent = await getAgent()
      //
      // config.httpsAgent = agent
      // config.httpsAgent = agent
      // config.proxy = false

      Reflect.deleteProperty(options, 'headers')

      const answer: IAnswer = Object.create(null)
      axios(config).then((res) => {
        const body = res.data
        answer.body = body

        answer.cookie = res.headers['set-cookie'] || []

        answer.config = res.config

        answer.status = body?.status || res?.status
        resolve(answer)
      }).catch(async(err) => {
        answer.status = 502
        answer.body = { code: 502, msg: err }
        reject(err)
      })
    })
  }
}

const request = createRequest()

export default request
