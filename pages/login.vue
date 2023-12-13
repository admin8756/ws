<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
        <el-card class="w-80">
            <h1 class="text-2xl mb-6">数据自动获取平台</h1>
            <el-form ref="loginForm" :model="loginForm" label-width="100px">
                <el-form-item label="请输入口令">
                    <el-input v-model="loginForm.passWord" type="password" :maxlength="10"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button class="float-right" type="primary" @click="login">登录</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script>
export default {
    data() {
        return {
            loginForm: {
                passWord: '',
            },
        };

    },
    methods: {
        login() {
            const { passWord } = this.loginForm
            this.$axios.post('/api/User/login', { passWord }).then(({ data }) => {
                if (data && data.success) {
                    this.$nuxt.$router.push('/')
                } else {
                    this.$message.warning(data.msg || '登录失败')
                }
            })
        },
    },
};
</script>
