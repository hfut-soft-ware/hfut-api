import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
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

export function createRequest() {
  return async(url: string, options: AxiosRequestConfig, query?: Partial<IQuery>): Promise<IAnswer> => {
    const headers = { ...(options.headers || {}), 'cookie': query?.cookie || '', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36' }

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async(resolve, reject) => {
      const config = { url, method: 'get', maxRedirects: 0, ...options, headers } as AxiosRequestConfig

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
