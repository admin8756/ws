<template>
  <div class="p-4">
    <el-tabs v-model="activeName" type="border-card">
      <el-tab-pane label="状态" name="state">
        <div class="flex flex-col md:flex-row w-full">
          <el-card class="w-full md:w-1/2 mb-4 md:mr-2">
            <div slot="header" class="flex justify-between">
              <span>服务器状态</span>
              <el-button type="primary" size="small">链接ws</el-button>
            </div>
            <div v-for="(item, index) in statusList" :key="index" class="md:p-4 p-2 flex justify-between rounded">
              <p class="font-bold text-lg mb-2">{{ item.title }}</p>
              <div class="text-gray-600">
                <template v-if="item.type === 'Boolean' || item.type === 'Number'">
                  <div :class="statusClasses(item.value)">
                    {{ item.state[item.value ? 1 : 0] }}
                  </div>
                </template>
                <template v-else-if="item.type === 'Date' || item.type === 'String'">
                  <span v-if="item.format">
                    {{ item.format(item.value) }}
                  </span>
                  <div v-else>
                    {{ item.value }}
                  </div>
                </template>
              </div>
            </div>
          </el-card>
          <el-card class="w-full md:w-1/2">
            <div slot="header" class="flex justify-between">
              <span>运行配置</span>
              <el-button type="primary" size="small" @click="saveRun">保存并运行</el-button>
            </div>
            <el-form ref="serveForm" :model="formData" :rules="rules">
              <el-form-item label="运行环境" prop="env">
                <el-radio-group v-model="formData.env">
                  <el-radio-button label="test">测试环境</el-radio-button>
                  <el-radio-button label="prod">生产环境</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="运行模式" prop="mode">
                <el-radio-group v-model="formData.mode">
                  <el-radio-button label="history">历史模式</el-radio-button>
                  <el-radio-button label="realTime">实时模式</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="formData.mode === 'history'" label="开始时间" prop="startTime">
                <el-date-picker v-model="formData.startDate" type="date"></el-date-picker>
              </el-form-item>
              <el-form-item v-if="formData.mode === 'history'" label="结束时间" prop="endTime">
                <el-date-picker v-model="formData.endDate" type="date"></el-date-picker>
              </el-form-item>
              <el-form-item v-if="formData.mode === 'history'" label="跳过已有数据" prop="skipDate">
                <el-switch v-model="formData.skipDate" active-text="跳过" inactive-text="覆盖">
                </el-switch>
              </el-form-item>
              <el-form-item v-if="formData.mode === 'realTime'" label="心跳时间" prop="heartTime">
                <el-input v-model="formData.heartTime" class="!w-[196px]" :default-value="1000">
                  <template slot="append">秒/次</template></el-input>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
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
    </el-tabs>
  </div>
</template>

<script>
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')
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
      statusList: [
        {
          title: '登录状态',
          type: 'Boolean',
          key: "logged",
          state: ['未登录', '已登录'],
          value: false,
        }, {
          title: '授权状态',
          type: 'Boolean',
          key: "CFCAstatus",
          state: ['未授权', '已授权'],
          value: false,
        },
        {
          title: "密钥是否导入",
          type: "Boolean",
          key: "cfcaKeyImport",
          state: ["未导入", "已导入"],
          value: false,
        }, {
          title: "服务运行时间",
          type: "String",
          key: "serviceTime",
          state: ["已运行", "未运行"],
          format: (value) => {
            return dayjs(value).format("YYYY-MM-DD HH:mm:ss")
          },
          value: '-',
        }, {
          title: "心跳最后运行时间",
          type: "String",
          key: "heartLastDate",
          state: ["已运行", "未运行"],
          format: (value) => {
            return dayjs(value).fromNow();
          },
          value: '-',
        }, {
          title: "服务版本",
          type: "String",
          key: "version",
          state: ["已运行", "未运行"],
          value: '-',
        },
      ],
      formData: {
        env: -1,
        mode: -1,
        skipDate: false,
        startDate: new Date(),
        endDate: new Date() + 1000 * 60 * 60 * 24 * 7,
        heartTime: null,
        coverTime: new Date(),
      },
      rules: {
        env: [
          {
            required: true, message: '请选择运行环境', trigger: 'change',
            validator: (rule, value, callback) => {
              if (+value === -1) {
                callback(new Error('请选择运行环境'))
              } else {
                callback()
              }
            }
          }
        ],
        mode: [
          {
            required: true, message: '请选择运行模式', trigger: 'change',
            validator: (rule, value, callback) => {
              if (+value === -1) {
                callback(new Error('请选择运行模式'))
              } else {
                callback()
              }
            }
          }
        ],
        startTime: [
          {
            required: true, message: '请选择开始时间', trigger: 'change',
            validator: (rule, value, callback) => {
              if (+this.formData.mode === 'history' && !value) {
                callback(new Error('请选择开始时间'));
              } else {
                callback();
              }
            }
          }
        ],
        endTime: [
          {
            required: true, message: '请选择结束时间', trigger: 'change',
            validator: (rule, value, callback) => {
              if (+this.formData.mode === 'history' && !value) {
                callback(new Error('请选择结束时间'));
              } else {
                callback();
              }
            }
          }
        ],
        heartTime: [
          {
            required: true, message: '请输入心跳时间', trigger: 'blur',
            validator: (rule, value, callback) => {
              if (+this.formData.mode === 'realTime' && !value) {
                callback(new Error('请输入心跳间隔时间'));
              } else {
                callback();
              }
            }
          },
          { pattern: /^\d+$/, message: '心跳时间必须为数字', trigger: 'blur' }
        ],
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
  created() {
    this.logFrom.date = dayjs().format("YYYY-MM-DD")
    this.getState()
  },
  methods: {
    getLogs() {
      const { date } = this.logFrom
      let baseUrl = `/api/Logs/getLogList/app/`
      if (date) {
        baseUrl = `${baseUrl}${date}`
      }
      this.$axios.get(baseUrl).then(res => {
        this.$axios.get(`/api/Logs/getLog/${res.data[0]}`).then(log => {
          this.list = log.data.map((k, i) => {
            const time = dayjs(k.time).format("YYYY-MM-DD HH:mm:ss")
            return { ...k, id: i, time }
          })
        })
      })
    },
    // 获取服务器配置
    getState() {
      this.$axios.get(`/api/Tools/state`).then(({ data }) => {
        // 循环formData动态的设置formData[key]的值
        Object.keys(this.formData).forEach(key => {
          this.formData[key] = data[key]
        })
        // 循环statusList动态的设置item.value的值
        this.statusList.forEach(item => {
          item.value = data[item.key]
        })
      })
    },
    saveRun() {
      this.$refs.serveForm.validate((valid) => {
        if (valid) {
          this.$axios.post('/api/Tools/saveConfig', this.formData).then(({ data }) => {
            if (data) {
              this.$axios.get(`/api/Tools/init`).then(res => {
                this.$message.success('发送成功')
              })
            } else {
              this.$message.warning('保存失败')
            }
          })
        } else {
          this.$message.warning("表单不完整")
          return false;
        }
      });

    },
  },
}
</script>
<style>
.el-form-item__content {
  float: right !important;
}

.el-date-editor.el-input,
.el-date-editor.el-input__inner {
  width: 196px;
}
</style>
<style scoped>
.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 15px;
  margin: 10px;
  overflow: auto;
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
