import axios, { AxiosPromise, AxiosRequestConfig } from 'axios'

interface IRequest {
  config: AxiosRequestConfig
  cookie?: string
}

export function getCookie(cookie: string | string[]): string {
  if (!Array.isArray(cookie)) {
    cookie = [cookie]
  }

  return cookie[0]
}

const headers = { cookie: '' }

export default function request(options: IRequest): AxiosPromise {
  return new Promise((resolve, reject) => {
    if (options.cookie) {
      headers.cookie = options.cookie
    }

    const config = { method: 'get', headers, maxRedirects: 0, ...(options.config) } as AxiosRequestConfig

    axios(config).then((res) => {
      resolve(res)
    }).catch((err) => {
      reject(err)
    })
  })
}
