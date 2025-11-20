let navObj = null

function setGlobalRef(ref) {
  navObj = ref
}

function navigate(path, props = {}) {
  if (!navObj) {
    console.warn('Navigation reference not set')
    return
  }
  try {
    navObj.navigate(path, props)
  } catch (error) {
    console.error('Navigation error:', error)
  }
}

function goBack() {
  if (!navObj) {
    console.warn('Navigation reference not set')
    return
  }
  try {
    navObj.goBack()
  } catch (error) {
    console.error('Navigation error:', error)
  }
}

export default {
  setGlobalRef,
  navigate,
  goBack
}
