/**
 * 成绩排名
 */
import getSemesterList from './semesterList'
import { communityRequest } from '@/shared/request'

import type { ServerFunction } from '@/shared/types'

const getRank: ServerFunction = async(query) => {
  const [{ data: semesterList }, { body: totalRankData }] = await Promise.all([getSemesterList(query), communityRequest('/api/business/score/querytotalscore', {}, query)])

  const rankList = await Promise.all(semesterList.map(async(semester: { xn: string; xq: string }) => {
    const { body } = await communityRequest(
      '/api/business/score/scoreselect',
      {
        params: semester,
      },
      query,
    )

    const { classRanking, gpa, majorRanking } = body.result

    return { classRanking, gpa, majorRanking, semesterName: `${semester.xn}学年第${semester.xq === '1' ? '一' : '二'}学期` }
  }))

  return {
    code: 200,
    msg: 'ok',
    data: {
      ...totalRankData.result,
      semester: rankList,
    },
  }
}

export default getRank
