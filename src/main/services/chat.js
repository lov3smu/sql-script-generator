import { log } from '../utils'
import { getConfig } from './config'
import { getProvider, PROVIDER_TYPES, PROVIDER_INFO, getAvailableProviders, getProviderModels } from './ai/index.js'
import { getSkillsManager, initSkills } from './skills.js'

const SYSTEM_PROMPT = `你是一个智能助手，可以帮助用户完成各种开发相关的任务。请主动使用工具来帮助用户。

回复格式规则：
- 在执行复杂任务前，先在<thinking>标签中输出你的思考过程
- 思考过程应包含：分析用户需求、选择合适工具、规划执行步骤、参数准备
- 思考内容要详细，不要只写开头几个字就停止
- 思考结束后，关闭</thinking>标签，然后输出最终回复
- 简单问题不需要思考过程，直接回复

示例格式：
<thinking>
分析用户需求：用户想要生成字典配置SQL脚本，需要包含字典名和字典值。
选择工具：应该使用 generate_dictionary_sql 工具。
准备参数：
- dict_name: 用户状态
- dict_values: 正常、禁用、已删除
- database: main_db
执行步骤：调用工具后检查结果，向用户汇报。
</thinking>
[调用工具，然后根据结果回复用户]

可用 Skills（技能）：
数据库类：
- dictionary-sql - 生成字典配置SQL（自动翻译中文到英文编码）
- function-group-sql - 生成功能权限组SQL（自动翻译中文到大驼峰编码）
- sql-script - 生成SQL脚本文件
- sql-optimize - 优化SQL查询性能
- sql-config - 获取SQL脚本配置信息

代码类：
- code-review - 审查代码质量、安全性、性能
- code-generate - 根据需求生成代码
- api-design - 设计RESTful API规范

文档类：
- doc-generate - 为代码生成文档说明

工具类：
- password - 生成随机密码
- timestamp - 时间戳与日期互转
- cron - 生成Cron表达式
- json-format - 格式化/验证JSON
- yaml-validate - 验证YAML格式

重要规则：
- 执行工具后，必须检查返回结果中的 success 字段
- 如果 success=true，告诉用户成功，并展示文件路径和关键信息
- 如果 success=false，必须告诉用户失败，并说明具体的 error 内容，不能说"已成功生成"
- 绝对不要在工具返回失败时回复"已成功"、"已完成"等虚假成功信息

字典配置生成规则：
- 当用户请求生成字典配置时，使用 dictionary-sql Skill
- dict_name: 字典名称（中文），如"用户状态"、"订单类型"
- dict_values: 字典值列表，每个值包含 name（中文）和可选的 sort（排序）、status（状态）
- 工具会自动将中文翻译成英文编码（全大写）作为 dict_value 和 dict_data_value
- database: 默认使用 main_db（字典管理表所在库），除非用户明确指定其他库
- 示例：用户说"生成字典配置：用户状态，值：正常、禁用、已删除"
  调用：dictionary-sql({dict_name:"用户状态", dict_values:[{name:"正常"},{name:"禁用"},{name:"已删除"}], database:"main_db"})

功能权限组生成规则：
- 当用户请求生成功能权限组时，使用 function-group-sql Skill
- app_group: 应用代码，如 "EBL"、"ORDER"
- function_groups: 功能权限组列表，最多三级
  - level: 层级（1顶级，2二级，3三级）
  - code/name: 中文名称，会自动翻译成大驼峰编码
  - parent_code: 父级编码（仅二级和三级需要，顶级不填）
  - sort: 排序（可选，顶级默认10，二级三级自动计算）
  - functions: 功能权限列表
    - code/name: 中文名称，会自动翻译成大驼峰编码
    - is_sensitive: 是否敏感（可选，默认0）
    - sort: 排序（可选，默认0）
    - status: 状态（可选，默认101001）
- database: 默认使用 user_db（功能权限表所在库）
- 示例：用户说"生成功能权限：应用EBL，顶级组-订单管理，包含功能-订单列表、订单详情"
  调用：function-group-sql({
    app_group: "EBL",
    function_groups: [{
      level: 1,
      code: "订单管理",
      name: "订单管理",
      sort: 10,
      functions: [
        {code: "订单列表", name: "订单列表"},
        {code: "订单详情", name: "订单详情"}
      ]
    }],
    database: "user_db"
  })

示例：
用户: "帮我生成一个SQL脚本，数据库是order_db，类型是DDL，用途是添加用户表"
<thinking>
用户需要生成DDL脚本，我需要调用sql-script Skill。
参数：database=order_db, operate_type=PUBLISH, script_type=DDL
</thinking>
你应该调用: sql-script({database: "order_db", operate_type: "PUBLISH", script_type: "DDL", dir_name: "添加用户表", usage: "添加用户表"})

用户: "生成一个修复脚本，数据库是user_db，用途是修复密码字段"
你应该调用: sql-script({database: "user_db", operate_type: "FIX", script_type: "DML", dir_name: "修复密码字段", usage: "修复密码字段"})

用户: "帮我生成字典配置，字典名是用户状态，值有正常、禁用、已删除，数据库是user_db"
你应该调用: dictionary-sql({dict_name: "用户状态", dict_values: [{name: "正常"}, {name: "禁用"}, {name: "已删除"}], database: "main_db", usage: "初始化用户状态字典"})

用户: "生成功能权限组，应用代码EBL，顶级组-系统管理，二级组-用户管理，功能-用户列表、用户详情"
你应该调用: function-group-sql({
  app_group: "EBL",
  function_groups: [
    {level: 1, code: "系统管理", name: "系统管理", sort: 10, functions: []},
    {level: 2, code: "用户管理", name: "用户管理", parent_code: "系统管理", functions: [
      {code: "用户列表", name: "用户列表"},
      {code: "用户详情", name: "用户详情"}
    ]}
  ],
  database: "user_db",
  usage: "初始化系统管理功能权限"
})

错误处理示例：
工具返回: {success: false, error: "缺少应用代码"}
正确回复: "生成失败：缺少应用代码，请提供应用代码参数"
错误回复（绝对不要）: "已成功生成SQL脚本"

工具返回: {success: true, filename: "S01-xxx.sql", file_path: "/path/to/file.sql"}
正确回复: "已成功生成SQL脚本 S01-xxx.sql，文件路径：/path/to/file.sql"`

async function getAllToolDefinitions() {
  await initSkills()
  
  const skillsManager = getSkillsManager()
  return skillsManager.getToolDefinitions()
}

async function executeToolCall(name, args) {
  try {
    const params = typeof args === 'string' ? JSON.parse(args) : args
    log.info('执行工具调用:', name, '参数:', params)
    
    const skillsManager = getSkillsManager()
    const skill = skillsManager.getSkill(name)
    
    if (skill) {
      log.info('调用 Skill:', name)
      return await skillsManager.executeSkill(name, params)
    }
    
    return { success: false, error: `未知工具: ${name}` }
  } catch (e) {
    log.error('工具执行失败:', e)
    return { success: false, error: `工具执行失败: ${e.message}` }
  }
}

function getProviderConfig() {
  const config = getConfig()
  const providerType = config.ai_provider || 'bailian'
  const apiKeys = config.ai_api_keys || {}
  
  const providerConfig = {
    apiKey: apiKeys[providerType] || ''
  }
  
  if (providerType === 'minimax') {
    providerConfig.groupId = apiKeys.minimax_group_id || ''
  }
  if (providerType === 'volcengine') {
    providerConfig.endpointId = apiKeys.volcengine_endpoint_id || ''
  }
  
  return { providerType, providerConfig }
}

async function chatWithToolsInternal(messages, options = {}) {
  const { providerType, providerConfig } = getProviderConfig()
  const provider = getProvider(providerType, providerConfig)
  
  if (!provider) {
    return { success: false, error: `未知的 AI Provider: ${providerType}` }
  }
  
  const validation = provider.validateConfig()
  if (!validation.valid) {
    return { success: false, error: `${provider.name} ${validation.error}，请在设置中配置` }
  }
  
  console.log('=== chatWithToolsInternal ===')
  console.log('Provider:', provider.name)
  console.log('Messages:', JSON.stringify(messages, null, 2))
  
  const model = options.model || provider.getDefaultModel()
  const allTools = await getAllToolDefinitions()
  
  const result = await provider.chat(messages, allTools, { model, ...options })
  
  if (!result.success) return result
  
  if (result.tool_calls && result.tool_calls.length > 0) {
    console.log('=== 检测到 tool_calls ===')
    console.log('tool_calls:', JSON.stringify(result.tool_calls, null, 2))
    
    messages.push({
      role: 'assistant',
      tool_calls: result.tool_calls
    })
    
    for (const call of result.tool_calls) {
      console.log('执行工具:', call.function.name)
      const toolResult = await executeToolCall(call.function.name, call.function.arguments)
      console.log('工具结果:', JSON.stringify(toolResult, null, 2))
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(toolResult)
      })
    }
    
    return await chatWithToolsInternal(messages, { model, ...options })
  }
  
  return result
}

async function chatWithTools(messages, options = {}) {
  console.log('=== chatWithTools 被调用 ===')
  console.log('原始 messages:', JSON.stringify(messages, null, 2))
  
  const messagesWithSystem = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ]
  
  return chatWithToolsInternal(messagesWithSystem, options)
}

export async function chat(messages, options = {}) {
  console.log('=== chat 函数被调用 ===')
  console.log('messages:', JSON.stringify(messages, null, 2))
  console.log('options:', options)
  const result = await chatWithTools(messages, options)
  console.log('=== chat 返回结果 ===')
  console.log('result:', JSON.stringify(result, null, 2))
  return result
}

export async function chatStream(messages, options = {}, onChunk) {
  console.log('=== chatStream 函数被调用 ===')
  console.log('messages:', JSON.stringify(messages, null, 2))
  console.log('options:', options)
  
  const { providerType, providerConfig } = getProviderConfig()
  const provider = getProvider(providerType, providerConfig)
  
  if (!provider) {
    return { success: false, error: `未知的 AI Provider: ${providerType}` }
  }
  
  const validation = provider.validateConfig()
  if (!validation.valid) {
    return { success: false, error: `${provider.name} ${validation.error}，请在设置中配置` }
  }
  
  const messagesWithSystem = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ]
  
  const model = options.model || provider.getDefaultModel()
  const allTools = await getAllToolDefinitions()
  
  const result = await chatStreamInternal(provider, messagesWithSystem, allTools, { model, ...options }, onChunk)
  
  return result
}

async function chatStreamInternal(provider, messages, tools, options, onChunk) {
  const model = options.model || provider.getDefaultModel()
  
  console.log('=== chatStreamInternal ===')
  console.log('Provider:', provider.name)
  
  const result = await provider.chatStream(messages, tools, { model, ...options }, onChunk)
  
  if (!result.success) return result
  
  if (result.tool_calls && result.tool_calls.length > 0) {
    console.log('=== 流式检测到 tool_calls ===')
    console.log('tool_calls:', JSON.stringify(result.tool_calls, null, 2))
    
    messages.push({
      role: 'assistant',
      content: result.content || '',
      tool_calls: result.tool_calls
    })
    
    if (onChunk && result.content) {
      onChunk('\n\n正在执行操作...\n')
    }
    
    for (const call of result.tool_calls) {
      console.log('执行工具:', call.function.name)
      const toolResult = await executeToolCall(call.function.name, call.function.arguments)
      console.log('工具结果:', JSON.stringify(toolResult, null, 2))
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(toolResult)
      })
      
      if (onChunk) {
        const toolName = call.function.name
        if (toolResult.success) {
          onChunk(`✓ ${toolName} 完成\n`)
        } else {
          onChunk(`✗ ${toolName} 失败: ${toolResult.error}\n`)
        }
      }
    }
    
    if (onChunk) {
      onChunk('\n')
    }
    
    return await chatStreamInternal(provider, messages, tools, { model, ...options }, onChunk)
  }
  
  return result
}

export async function validateApiKey(providerType, apiKey, extraConfig = {}) {
  console.log('=== validateApiKey ===')
  console.log('provider:', providerType)
  console.log('apiKey:', apiKey)
  console.log('extraConfig:', extraConfig)
  
  const config = {
    apiKey,
    ...extraConfig
  }
  
  const provider = getProvider(providerType, config)
  
  if (!provider) {
    log.warn(`未知的 Provider: ${providerType}`)
    return false
  }
  
  console.log('Provider apiKey:', provider.apiKey)
  const result = await provider.validateApiKey()
  console.log('验证结果:', result)
  return result
}

export { getAvailableProviders, getProviderModels, PROVIDER_TYPES, PROVIDER_INFO }