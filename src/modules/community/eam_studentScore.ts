/**
 * 根据学期 id 获取成绩列表
 */
import semesterList from './semesterList'
import { communityRequest } from '@/shared/request'
import { Semester } from '@/shared/constant'

import type { ServerFunction } from '@/shared/types'

interface Query {
  /** semesterId: 例如： 214 */
  semester?: string
}

const getStudentScore: ServerFunction<Query> = async(query) => {
  const { semester: semesterStr } = query.req.query

  const querySemester: { xn: string; xq: string; semesterName: string }[] = []

  if (!semesterStr) {
    const { data } = await semesterList(query)
    const querysemesterlist = (data as { xn: string; xq: string }[]).reverse()
    querySemester.push(
      ...querysemesterlist.map(item => ({
        ...item,
        // 找到 sermesterCode
        semesterName: Semester.find(semester => semester.name.includes(item.xn) && semester.name.includes(item.xq === '1' ? '一' : '二'))!.name,
      })),
    )
  } else {
    const semesterCode = parseInt(semesterStr)
    const semesterName = Semester.find(item => semesterCode === item.code)?.name
    semesterName
      && querySemester.push({ xn: semesterName.substring(0, 9), xq: semesterName.includes('二') ? '2' : '1', semesterName })
  }

  const result = await Promise.all(
    querySemester.map(async(semester) => {
      const { body } = await communityRequest(
        '/api/business/score/scoreselect',
        {
          params: semester,
        },
        query,
      )
      const score = body.result.scoreInfoDTOList.map((item: any) => ({
        name: item.courseName,
        credit: item.credit,
        gpa: item.gpa,
        score: item.score,
      }))
      return { score, semester: semester.semesterName }
    }),
  )

  return {
    code: 200,
    msg: 'ok',
    data: result,
  }
}

export default getStudentScore
