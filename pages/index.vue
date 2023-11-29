<template>
  <div class="p-4">
    <el-tabs v-model="activeName">
      <el-tab-pane label="状态" name="state">
        <el-card body-style="padding:0">
          <div slot="header" class="flex justify-between items-center">
            <div class="block">
              ws链接状态: <span class="text-red-500">已连接</span>
            </div>
            <el-button type="primary" @click="getLogs">连接</el-button>
          </div>
          <div class="card" v-for="(item, index) in serviceList" :key="index" :class="item.level">
            <div>
              <div class="font-bold">{{ item.title }}</div>
              <div class="mt-2">{{ item.type }}</div>
            </div>
            <div class="font-bold">{{ item.key.toUpperCase() }}</div>
          </div>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="日志" name="logs">
        <el-card body-style="padding:0">
          <div slot="header" class="flex justify-between">
            <div class="block">
              <el-date-picker style="width: 200px;" v-model="logFrom.date" type="date" placeholder="选择日期">
              </el-date-picker>
            </div>
            <el-button type="primary" @click="getLogs">获取日志</el-button>
          </div>
          <div class="h-[80vh] overflow-auto">
            <DynamicScroller :item-size="26" :min-item-size="20" :items="list" key-field="id">
              <template #default="{ item, index, active }">
                <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[item.msg]" :data-index="index">
                  <div class="card" :class="item.level">
                    <div>
                      <div class="font-bold">{{ item.msg }}</div>
                      <div class="mt-2">{{ item.time }}</div>
                    </div>
                    <div class="font-bold">{{ item.type.toUpperCase() }}</div>
                  </div>
                </DynamicScrollerItem>
              </template>
            </DynamicScroller>
          </div>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="管理" name="third">工具管理</el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import dayjs from 'dayjs';
export default {
  components: {
    DynamicScroller,
    DynamicScrollerItem
  },
  data() {
    return {
      list: [],
      logFrom: {
        date: ""
      },
      serviceList: [
        {
          title: "授权状态",
          type: "Boolean",
          key: "authorization",
          state: ["已授权", "未授权"],
        },
        {
          title: "登录状态",
          type: "Boolean",
          key: "alreadyLogged",
          state: ["已登录", "未登录"],
        },
        {
          title: "加解密",
          type: "Boolean",
          key: "decryption",
          state: ["可用", "不可用"],
        },
        {
          title: "服务运行时间",
          type: "Date",
          key: "serviceTime",
          state: ["已运行", "未运行"],
        },
        {
          title: "服务版本",
          type: "String",
          key: "serviceVersion",
          state: ["已运行", "未运行"],
        },
        {
          title: "运行环境",
          type: "Number",
          key: "environment",
          state: ["测试环境", "生产环境"],
        },
        {
          title: "运行状态",
          type: "Boolean",
          key: "status",
          state: ["正在运行", "停止运行"],
        },
        {
          title: "运行模式",
          type: "Number",
          key: "mode",
          state: ["历史模式", "即时模式"],
        },
      ],
      serviceState: {

      },
      activeName: "state"
    }
  },
  created() {
    this.logFrom.date = dayjs().format("YYYY-MM-DD")
  },
  methods: {
    getLogs() {
      const { date } = this.logFrom
      let baseUrl = `/api/Logs/getLogList/app/`
      if (date) {
        baseUrl = `${baseUrl}/${date}`
      }
      this.$axios.get(baseUrl).then(res => {
        this.$axios.get(`/api/Logs/getLog/${res.data[0]}`).then(log => {
          this.list = log.data.map((k, i) => {
            return { ...k, id: i }
          })
        })
      })
    },

  },
}
</script>
<style scoped>
.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 15px;
  margin: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card strong {
  margin-right: 5px;
}

.card.ERROR {
  background: #f13f3680;
}

.card.WARN {
  background: #ee8f3b80;
}

.card.DEBUG {
  background: #2d9ef580;
}

.card.INFO {
  background: #97979780;
}

/* 基本按钮样式 */
.button {
  display: inline-block;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}
</style>
