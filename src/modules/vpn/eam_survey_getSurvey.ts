import { IQuery } from '../../server'
import request from '../../shared/request'

interface RadioQuestion {
  id: string
  question: string
  option: string[]
}

const objectiveOptions = ['超过目标', '达到目标', '未达目标']

export default async function(query: IQuery) {
  const taskId = query.req.query.taskId as string
  const { body: res } = await request(`https://webvpn.hfut.edu.cn/http/77726476706e69737468656265737421faef469034247d1e760e9cb8d6502720ede479/eams5-student/for-std/lesson-survey/start-survey/${taskId}/get-data?vpn-12-o1-jxglstu.hfut.edu.cn`, {}, query)
  const radioQuestions: RadioQuestion[] = []

  radioQuestions.push(...handleObjectives(res.syllabus?.courseObjectives))
  radioQuestions.push(...handleObjectives(res.syllabus?.learningObjectives))

  const survey = res.survey
  radioQuestions.push(...handleRadioQuestions(survey.radioQuestions))
  const blankQuestion = survey.blankQuestions[0]
  return {
    code: 200,
    msg: '获取教评选项成功',
    data: {
      surveyAssoc: res.lessonSurveyLesson.surveyAssoc,
      radioQuestions,
      blankQuestion: {
        id: blankQuestion.id,
        question: blankQuestion.title,
      },
    },
  }
}

function handleObjectives(objectives: any[] | undefined) {
  if (!objectives) {
    return []
  }
  return objectives.map<RadioQuestion>((item) => {
    return {
      id: item.id,
      question: item.name,
      option: objectiveOptions,
    }
  })
}

function handleRadioQuestions(radioQuestions: any[]) {
  return radioQuestions.map<RadioQuestion>((item) => {
    return {
      id: item.id,
      question: item.title,
      option: (item.options as any[]).map(option => option.name),
    }
  })
}
