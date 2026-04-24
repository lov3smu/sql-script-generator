export async function copyToClipboard(text, onSuccess, onError) {
  try {
    await navigator.clipboard.writeText(text)
    onSuccess?.('已复制到剪贴板')
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)
    
    try {
      const success = document.execCommand('copy')
      if (success) {
        onSuccess?.('已复制到剪贴板')
        return true
      } else {
        onError?.('复制失败')
        return false
      }
    } catch {
      onError?.('复制失败')
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }
}