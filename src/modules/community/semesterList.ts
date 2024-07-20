/**
 * 获取学期列表
 */
import { communityRequest } from '@/shared/request'

import type { ServerFunction } from '@/shared/types'

const getSemesterList: ServerFunction = async(query) => {
  const { body } = await communityRequest('/api/business/score/querysemesterlist', {}, query)

  return {
    code: 200,
    msg: 'ok',
    data: body.result,
  }
}

export default getSemesterList
