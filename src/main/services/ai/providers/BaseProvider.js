import https from 'https'
import { log } from '../../../utils'

class BaseProvider {
  constructor(config) {
    this.apiKey = config.apiKey
    this.name = config.name
    this.models = config.models || []
    this.defaultModel = config.defaultModel
    this.hostname = config.hostname
    this.path = config.path
    this.validateModel = config.validateModel || this.defaultModel
  }

  getModels() {
    return this.models
  }

  getDefaultModel() {
    return this.defaultModel
  }

  validateConfig() {
    if (!this.apiKey || this.apiKey.trim() === '') {
      return { valid: false, error: 'API Key 未配置' }
    }
    return { valid: true }
  }

  buildRequestBody(messages, tools, options) {
    const model = options.model || this.defaultModel
    const body = {
      model,
      messages,
      tools,
      tool_choice: 'auto'
    }
    if (options.max_tokens) body.max_tokens = options.max_tokens
    if (options.temperature !== undefined) body.temperature = options.temperature
    return body
  }

  parseResponse(responseData) {
    const message = responseData.choices?.[0]?.message
    return {
      success: true,
      content: message?.content || '',
      tool_calls: message?.tool_calls,
      model: responseData.model,
      usage: responseData.usage
    }
  }

  async chat(messages, tools, options = {}) {
    const requestBody = this.buildRequestBody(messages, tools, options)
    
    console.log(`=== ${this.name} 发送请求 ===`)
    console.log('请求体:', JSON.stringify(requestBody, null, 2))

    const result = await this.makeRequest(this.hostname, 443, this.path, requestBody)
    
    if (!result.success) return result

    const responseData = result.data
    console.log(`=== ${this.name} 响应 ===`)
    console.log(JSON.stringify(responseData, null, 2))

    return this.parseResponse(responseData)
  }

  async validateApiKey() {
    const requestBody = {
      model: this.validateModel,
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 5
    }

    const result = await this.makeRequest(this.hostname, 443, this.path, requestBody)
    return result.success
  }

  async makeRequest(hostname, port, path, requestBody) {
    return new Promise((resolve) => {
      const req = https.request(
        {
          hostname,
          port: port || 443,
          path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => { data += chunk })
          res.on('end', () => {
            try {
              const responseData = JSON.parse(data)
              if (res.statusCode !== 200) {
                log.error(`${this.name} API 错误:`, responseData)
                resolve({
                  success: false,
                  error: responseData.error?.message || `请求失败: ${res.statusCode}`
                })
                return
              }
              resolve({ success: true, data: responseData })
            } catch (e) {
              log.error('解析响应失败:', e)
              resolve({ success: false, error: '解析响应失败' })
            }
          })
        }
      )

      req.on('error', (e) => {
        log.error(`${this.name} API 请求失败:`, e)
        resolve({ success: false, error: `网络请求失败: ${e.message}` })
      })

      req.write(JSON.stringify(requestBody))
      req.end()
    })
  }
}

export default BaseProvider