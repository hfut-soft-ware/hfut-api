import request from '../request'
import type { IQuery } from '../../server'

const url1 = 'http://jxglstu.hfut.edu.cn/eams5-student/for-std/lesson-search'

export const isObject = (val: unknown): val is object =>
  val !== null && typeof val === 'object'

export const isEmptyObject = (val: unknown): val is object =>
  isObject(val) && Object.keys(val).length === 0

export const getUniqueId = async(query: IQuery) => {
  const { headers } = await request(url1, {
    maxRedirects: 0,
    validateStatus(status) {
      return status === 302
    },
  }, query)
  if (headers.location.startsWith('/eams5-student/login')) {
    return {
      success: false,
      uniqueId: 0,
    }
  }
  return {
    success: true,
    uniqueId: headers!.location.split('/')[5],
  }
}
