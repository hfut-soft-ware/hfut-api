import { IQuery } from '../../server'
import request from '../request'

const url = 'https://cas.hfut.edu.cn/cas/login?service=http%3A%2F%2F210.45.242.5%3A8080%2Freader%2Fhwthau2.php'
const url1 = 'http://210.45.242.5:8080/reader/hwthau2.php'

export const libraryLogin = async(query: IQuery) => {
  const { headers: headers1 } = await request(url, {
    validateStatus(status) {
      return status >= 200 || status === 302
    },
  }, query)

  const { headers: headers2 } = await request(headers1!.location, {
    validateStatus(status) {
      return status >= 200 || status === 302
    },
  }, query)
  query.cookie = headers2!['set-cookie']![0].split(';')[0]
  await request(url1, {
    validateStatus(status) {
      return status >= 200 || status === 302
    },
  }, query)

  return {
    cookie: query.cookie,
  }
}
