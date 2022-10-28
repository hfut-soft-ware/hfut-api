import axios, { AxiosError } from 'axios'
const start = Date.now()
axios.get('http://localhost:8082/card/flowWater', {
  params: {
    // isCardCookie: 'false',
    startDate: '20221025',
    endDate: '20221028',
    pageNum: 1,
  },
  headers: {
    cookie: 'JSESSIONID=1299F9E79F1AAA4CA11799B5CE11852B',
  },
}).then(({ data }) => {
  const end = Date.now()
  console.log(end - start)
  console.log(data.data.list)
}).catch((error: AxiosError) => {
  const end = Date.now()
  console.log(end - start)
  console.log(error.message)
})
