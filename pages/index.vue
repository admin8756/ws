<template>
  <div class="p-4">
    <el-tabs v-model="activeName">
      <el-tab-pane label="状态" name="state">
        <el-card body-style="padding:0">
          <div slot="header" class="flex justify-between items-center">
            <div class="block">
              ws链接状态: <span class="text-red-500">已连接</span>
            </div>
            <el-button type="primary" @click="getState">连接</el-button>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 overflow-auto h-[80vh]">
            <div v-for="(item, index) in serviceList" :key="index" class="p-4 rounded shadow-md bg-white">
              <p class="font-bold text-lg mb-2">{{ item.title }}</p>
              <div class="text-gray-600">
                <template v-if="item.type === 'Boolean'">
                  <!-- Boolean type structure -->
                  <div :class="statusClasses(item.value)">
                    {{ item.state[item.value ? 0 : 1] }}
                  </div>
                </template>
                <template v-else-if="item.type === 'Date'">
                  <!-- Date type structure -->
                  <div>
                    {{ item.value }}
                  </div>
                </template>
                <template v-else-if="item.type === 'String'">
                  <!-- String type structure -->
                  <div>
                    {{ item.value }}
                  </div>
                </template>
                <template v-else-if="item.type === 'Number'">
                  <!-- Number type structure -->
                  <div :class="statusClasses(item.value)">
                    {{ item.state[item.value ? 0 : 1] }}
                  </div>
                </template>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="日志" name="logs">
        <el-card body-style="padding:0">
          <div slot="header" class="flex justify-between">
            <div class="block">
              <el-date-picker v-model="logFrom.date" style="width: 200px;" type="date" placeholder="选择日期">
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
      <el-tab-pane label="管理" name="third">
        <el-button>开始运行</el-button>
      </el-tab-pane>
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
          title: '脚本运行状态',
          type: 'Boolean',
          key: "runStatus",
          state: ['未在运行', '正在运行'],
          value: false,
        }, {
          title: '心跳状态',
          type: 'Boolean',
          key: "heartStatus",
          state: ['未在运行', '正在运行'],
          value: false,
        },
        {
          title: "授权状态",
          type: "Boolean",
          key: "authorization",
          state: ["已授权", "未授权"],
          value: false,
        },
        {
          title: "登录状态",
          type: "Boolean",
          key: "logged",
          state: ["已登录", "未登录"],
          value: false,
        },
        {
          title: "加解密",
          type: "Boolean",
          key: "decryption",
          state: ["可用", "不可用"],
          value: false,
        },
        {
          title: "服务运行时间",
          type: "Date",
          key: "serviceTime",
          state: ["已运行", "未运行"],
          value: '-',
        },
        {
          title: "服务版本",
          type: "String",
          key: "version",
          state: ["已运行", "未运行"],
          value: '-',
        },
        {
          title: "运行环境",
          type: "Number",
          key: "env",
          state: ["测试环境", "生产环境"],
          value: -1,
        },
        {
          title: "运行状态",
          type: "Boolean",
          key: "status",
          state: ["正在运行", "停止运行"],
          value: false
        },
        {
          title: "运行模式",
          type: "Number",
          key: "mode",
          state: ["历史模式", "即时模式"],
          value: -1
        },
      ],
      serviceState: {

      },
      activeName: "state"
    }
  },
  computed: {
    statusClasses() {
      return (value) => ({
        'text-green-500': value,
        'text-red-500': !value,
      });
    },
  },
  async created() {
    this.logFrom.date = dayjs().format("YYYY-MM-DD")
    const data = await this.$axios.get(`/api/Tools/init`)
    console.log(data)
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
    getState() {
      this.$axios.get(`/api/Tools/state`).then(res => {
        console.log(res.data)
        // this.serviceState = res.data
        // this.serviceList.forEach(item => {
        //   item.value = this.serviceState[item.key]
        // })
      })
    }
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
</style>
