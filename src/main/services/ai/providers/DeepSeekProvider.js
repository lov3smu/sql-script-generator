import BaseProvider from './BaseProvider.js'

class DeepSeekProvider extends BaseProvider {
  constructor(apiKey) {
    super({
      name: 'DeepSeek',
      apiKey,
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      validateModel: 'deepseek-chat',
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek-Chat (推荐)' },
        { id: 'deepseek-coder', name: 'DeepSeek-Coder (编程)' },
        { id: 'deepseek-reasoner', name: 'DeepSeek-Reasoner (推理)' }
      ],
      defaultModel: 'deepseek-chat'
    })
  }
}

export default DeepSeekProvider