declare module 'react-pageflip' {
  import { Component, CSSProperties, ReactNode } from 'react'

  interface FlipEvent {
    data: number
  }

  interface FlipSetting {
    width: number
    height: number
    size?: 'fixed' | 'stretch'
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
    drawShadow?: boolean
    flippingTime?: number
    usePortrait?: boolean
    startPage?: number
    autoSize?: boolean
    maxShadowOpacity?: number
    showCover?: boolean
    mobileScrollSupport?: boolean
    swipeDistance?: number
    clickEventForward?: boolean
    useMouseEvents?: boolean
    children?: ReactNode
    className?: string
    style?: CSSProperties
    onFlip?: (e: FlipEvent) => void
    onChangeOrientation?: (e: { data: string }) => void
    onChangeState?: (e: { data: string }) => void
    onInit?: (e: FlipEvent) => void
  }

  interface PageFlipInstance {
    flipNext(corner?: 'top' | 'bottom'): void
    flipPrev(corner?: 'top' | 'bottom'): void
    flip(page: number, corner?: 'top' | 'bottom'): void
    turnToPage(page: number): void
    getCurrentPageIndex(): number
    getPageCount(): number
    destroy(): void
  }

  class HTMLFlipBook extends Component<FlipSetting> {
    pageFlip(): PageFlipInstance
  }

  export default HTMLFlipBook
}
