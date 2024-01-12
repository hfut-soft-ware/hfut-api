import type { ServerFunction } from '@/shared/types'

const getStudentScore: ServerFunction = async(query) => {
  return {
    code: 200,
    msg: 'ok',
    data: {
      aaa: query.cookie,
    },
  }
}

export default getStudentScore
