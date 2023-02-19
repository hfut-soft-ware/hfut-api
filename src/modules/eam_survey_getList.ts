import { load } from 'cheerio'
import { AxiosError } from 'axios'
import { IQuery } from '../server'
import request from '../shared/request'

interface SurveyTask {
  teacherName: string
  id: number
  submitted: boolean
}

interface List {
  courseName: string
  timeRange: string
  surveyTasks: SurveyTask[]
}

const baseUrl = 'http://jxglstu.hfut.edu.cn'

export default async function(query: IQuery) {
  let semesterId = query.req.query.semesterId

  let locatonPath = ''
  try {
    await request(`${baseUrl}/eams5-student/for-std/lesson-survey`, {}, query)
  } catch (error) {
    locatonPath = (error as AxiosError).response!.headers.location
  }

  if (!semesterId) {
    const res0 = await request(baseUrl + locatonPath, {}, query)
    semesterId = getDefaultSemesterId(res0.body)
  }

  const studentId = getStudentId(locatonPath)
  const res1 = await request(`${baseUrl}/eams5-student/for-std/lesson-survey/${semesterId}/search/${studentId}`, {}, query)

  const surveyItems = res1.body.forStdLessonSurveySearchVms as any[]
  const list: List[] = []
  surveyItems.forEach((surveyItem) => {
    const lessonSurveyTasks = surveyItem.lessonSurveyTasks as any[]
    const tasks: SurveyTask[] = []

    lessonSurveyTasks.forEach((taskItem) => {
      tasks.push({
        id: taskItem.id,
        teacherName: taskItem.teacher.person.nameZh,
        submitted: taskItem.submitted,
      })
    })

    list.push({
      courseName: surveyItem.course.nameZh,
      timeRange: handleTime(surveyItem.openEndTimeContent),
      surveyTasks: tasks,
    })
  })

  return {
    code: 200,
    msg: '获取评列表成功',
    data: {
      list,
      studentId,
    },
  }
}

function getDefaultSemesterId(html: string) {
  const $ = load(html)
  const optionElement = $('option:first-child')
  return optionElement.attr('value')
}

function getStudentId(locatonPath: string) {
  const items = locatonPath.split('/')
  return items[items.length - 1]
}
function handleTime(openEndTimeContent: string) {
  const times = openEndTimeContent.split('~')

  return `${times[0].split(' ')[0]}~${times[1].split(' ')[0]}`
}
