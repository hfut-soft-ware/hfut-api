import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

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
  return (url: string, options: AxiosRequestConfig, cookie?: string): Promise<IAnswer> => {
    const headers = { ...(options.headers || {}), 'cookie': cookie || '', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36' }
    return new Promise((resolve, reject) => {
      delete options.headers
      const config = { url, method: 'get', maxRedirects: 0, ...options, headers } as AxiosRequestConfig

      const answer: IAnswer = Object.create(null)
      axios(config).then((res) => {
        const body = res.data
        answer.body = body

        answer.cookie = res.headers['set-cookie'] || []

        answer.config = res.config

        answer.status = body?.status || res?.status
        resolve(answer)
      }).catch((err) => {
        answer.status = 502
        answer.body = { code: 502, msg: err }
        reject(err)
      })
    })
  }
}

const request = createRequest()

export default request
