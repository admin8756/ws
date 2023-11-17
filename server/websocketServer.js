import { Server } from 'ws'

// 创建一个 WebSocket 服务器，监听指定的端口
const wss = new Server({ port: 8090 }) // 选择你希望使用的端口号

let WebS = null

// 收到消息回调
const receiveMessage = (message) => {
  WebS.send(`你刚刚说：${message}`)
}

// 链接成功回调
const linkSuccessful = (ws) => {
  WebS = ws
  ws.on('message', receiveMessage)
  ws.send('ws链接成功')
}
// 监听连接
wss.on('connection', linkSuccessful)

