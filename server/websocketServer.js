import { Server } from 'ws'
import { logger } from '../utils/logs'
import { Config } from '../utils/index'

let webSocketServer = null

const receiveMessage = (message) => {
  // WebS.send(`你刚刚说：${message}`)
}

const linkSuccessful = (ws) => {
  webSocketServer = ws
  ws.on('message', receiveMessage)
  // ws.send('ws链接成功')
  // 监听config变化
  Config.onChange((config) => {
    ws.send(`${JSON.stringify(config)}`)
  })
  // Config.on('change', (key, value) => {
  // 开始定时器
  // setInterval(() => {
  //   ws.send('定时器发送消息')
  // }, 1000)
}

let wss = null

if (wss) {
  wss.close()
} else {
  try {
    wss = new Server({ port: 12591 })
    wss.on('connection', linkSuccessful)
  } catch (error) {
    logger.error('WebSocket服务器创建失败:' + JSON.stringify(error))
  }
}

export default webSocketServer
