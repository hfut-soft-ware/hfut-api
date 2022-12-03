import { AxiosError } from 'axios'
import { IQuery } from '../server'
import { parserAccount, parserFlowWater } from '../shared/utils/card'
import { cardLogin } from '../shared/utils/cardLogin'
import request from '../shared/request'

const base_url = 'http://172.31.248.20'
const url0 = `${base_url}/accounttodayTrjn.action`
const url1 = `${base_url}/accounttodatTrjnObject.action`

export default async function(query: IQuery) {
  const isCardCookie = query.req.query.isCardCookie || 'true'
  if (isCardCookie === 'false') {
    const { cookie } = await cardLogin(query)
    query.cookie = cookie
  }
  const { req } = query

  const type = (req.query.type as string) || 'all'

  let resBody = ''
  try {
    const res0 = await request(url0, {}, query)
    resBody = res0.body
  } catch (err) {
    const code = (err as AxiosError).response?.status
    if (code === 302) {
      return {
        code: 401,
        msg: (err as AxiosError).message,
      }
    }
    return {
      code: 500,
      msg: (err as AxiosError).message,
    }
  }

  const account = parserAccount(resBody)

  let res
  res = await request(
    url1,
    {
      method: 'POST',
      data: `account=${account}&inputObject=${type}`,
      maxRedirects: 10,
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
    query,
  )

  const data = parserFlowWater(res.body)

  return {
    code: 200,
    msg: '获取一卡通流水信息成功',
    data: {
      ...data,
      cardCookie: query.cookie,
    },
  }
}
