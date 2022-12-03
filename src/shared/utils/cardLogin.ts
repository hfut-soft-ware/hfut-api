import { AxiosError } from 'axios'
import { IQuery } from '../../server'
import request from '../request'

const url = 'https://cas.hfut.edu.cn/cas/login?service=http://172.31.248.20/ahdxdrPortalHome.action'

export const cardLogin = async(query: IQuery) => {
  const payload = { cookie: '' }
  let location1 = ''
  try {
    await request(url, {}, query)
  } catch (err) {
    location1 = (err as AxiosError).response!.headers!.location
  }

  let location2 = ''
  try {
    await request(location1, {}, query)
  } catch (err) {
    const cookie = (err as AxiosError).response!.headers!['set-cookie']![0].split(';')[0]
    payload.cookie = cookie
    location2 = (err as AxiosError).response!.headers!.location
  }
  await request(location2, {}, payload)
  return {
    cookie: payload.cookie,
  }
}
