import { AxiosError } from 'axios'
import { IQuery } from '../server'
import { cardLogin } from '../shared/utils/cardLogin'
import request from '../shared/request'
import { parserAccount, parserFlowWater } from '../shared/utils/card'

const base_url = 'http://172.31.248.20'

const url0 = `${base_url}/accounthisTrjn.action`
const url1 = `${base_url}/accounthisTrjn1.action`
const url2 = `${base_url}/accounthisTrjn2.action`
const url3 = `${base_url}/accounthisTrjn3.action`
const url4 = `${base_url}/accountconsubBrows.action`

function parserPageNum(page: any): number {
  const pageNum = parseInt(page || '1')
  return pageNum >= 1 ? pageNum : 1
}

export default async function(query: IQuery) {
  const isCardCookie = query.req.query.isCardCookie || 'true'
  if (isCardCookie === 'false') {
    const { cookie } = await cardLogin(query)
    query.cookie = cookie
  }
  const { req } = query

  const type = (req.query.type as string) || 'all'
  const startDate = req.query.startDate as string
  const endDate = req.query.endDate as string

  const pageNum = parserPageNum(req.query.pageNum)

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

  await request(
    url1,
    {
      method: 'POST',
      data: `account=${account}&inputObject=${type}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
    query,
  )

  await request(
    url2,
    {
      method: 'POST',
      data: `inputStartDate=${startDate}&inputEndDate=${endDate}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
    query,
  )

  let res2
  res2 = await request(
    url3,
    {
      method: 'POST',
      maxRedirects: 10,
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
    query,
  )

  if (pageNum !== 1) {
    res2 = await request(
      url4,
      {
        method: 'POST',
        maxRedirects: 10,
        responseType: 'arraybuffer',
        data: `inputStartDate=${startDate}&inputEndDate=${endDate}&pageNum=${pageNum}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
      },
      query,
    )
  }
  const data = parserFlowWater(res2.body)

  return {
    code: 200,
    msg: '获取一卡通流水信息成功',
    data: {
      ...data,
      cardCookie: query.cookie,
    },
  }
}
