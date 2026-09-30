import { Capacitor, registerPlugin } from '@capacitor/core'
import { App } from '@capacitor/app'
import { Share } from '@capacitor/share'
export const isNative = Capacitor.isNativePlatform()
export async function setupNative() {
  if (!isNative) return
  document.documentElement.classList.add('native-app')
  await App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack && location.pathname !== '/' && location.pathname !== '/login') history.back()
    else App.minimizeApp()
  })
  if (!navigator.share) navigator.share = async ({title,text,url}) => Share.share({title,text,url})
}

export const PalzyAudio = registerPlugin('PalzyAudio')
